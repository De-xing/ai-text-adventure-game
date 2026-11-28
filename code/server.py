#!/usr/bin/env python3
"""EchoQuest server: static site + server-side AI agent proxy.

The API key stays on the server. The browser never receives it.
"""
from __future__ import annotations

import json
import math
import mimetypes
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict, deque
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from agent_runtime import build_plan, route_tool
from guardrails import inspect_text
import memory_store

ROOT = Path(__file__).resolve().parent
SECRET_FILE = ROOT / ".secrets" / "api.json"
KNOWLEDGE_DIR = ROOT / "knowledge"
TOOLS_FILE = ROOT / "tools" / "whitelist.json"
HOST = os.environ.get("ECHOQUEST_HOST", "127.0.0.1")
PORT = int(os.environ.get("ECHOQUEST_PORT", "8000"))
MAX_BODY = 48 * 1024
DAILY_LIMIT = int(os.environ.get("ECHOQUEST_DAILY_LIMIT", "300"))
RATE_LIMIT_PER_HOUR = int(os.environ.get("ECHOQUEST_RATE_LIMIT", "8"))
ALLOWED_ORIGIN_HOSTS = set(
    filter(None, [x.strip() for x in os.environ.get("ECHOQUEST_ALLOWED_HOSTS", "").split(",")])
)

SYSTEM_ARCHITECT = """你是 EchoQuest 的“故事架构 Agent”。你的首要任务不是套用固定模板，而是根据用户的故事背景，从零设计一个专属的互动叙事流程。

禁止事项：
- 不要默认加入“收到一封信”“前往灯塔”“检查信封”等元素。
- 如果背景里没有信，就不要写信；如果背景里没有失踪者，就不要写失踪者。
- 不要沿用固定的 8 个节点结构。

设计前先在内部判断：
1. 故事真正的驱动力是什么：关系变化、比赛、调查、逃亡、复仇、生存、恋爱、冒险、复仇、成长？
2. 主角最想要什么，阻力是什么，失败会失去什么？
3. 哪些人物、地点、物品必须出现？哪些场景最能制造选择？
4. 至少设计 2 个真正有意义的分歧点，让不同选择走向不同后果，而不是同一段话换个说法。

固定技术要求：
- 根据用户选择的剧情长度设计节点：短篇 6–8 个、中篇 9–12 个、长篇 13–16 个（含结局节点）。
- nodes 数组顺序就是推进顺序；所有选择只能指向数组中更靠后的节点，禁止回环。
- 非结局节点必须有 2–4 个选项；结局节点 choices 必须为空。
- 必须从 startNodeId 开始，所有节点都要从起点可达。
- 结局数量：1 个时只输出 1 个结局；3 个时输出 good、bad、hidden 各一个。
- 节点 ID 使用 s1、s2… 与 e1、e2…。
- 每个节点的 choices 包含 text、to，可选 effects、items、requires。
- effects 只能使用 hp、insight、bond，数值范围：hp -15~+10，insight/bond -2~+2。
- 只有 hidden 结局的入边可以选择性设置 requires，例如 {"stat":"insight","min":2,"label":"需要 2 条线索"}。
- 不要写完整正文，只写节点目的、摘要、选项意图，供下一个写作 Agent 展开。
- 输出一个合法 JSON 对象，不要 Markdown、代码围栏或解释。
- 禁止色情、仇恨、自残教程、真实暴力教程。悬疑惊悚可以，但不要血腥细节。

JSON 结构：
{
  "title": "不超过 16 字的标题",
  "subtitle": "不超过 36 字的副标题",
  "genreLabel": "悬疑 · 校园",
  "era": "时代",
  "tone": "情绪基调",
  "synopsis": "100 字以内简介",
  "theme": "一句话主题",
  "coverHint": "school|sea|city|space|wasteland|forest|romance 之一",
  "statNames": {"hp": "体力", "insight": "线索", "bond": "信任"},
  "characters": [
    {"name": "角色名", "role": "身份", "tone": "stranger", "desc": "与主角的关系和秘密"}
  ],
  "items": [
    {"name": "初始物品名", "desc": "物品描述", "initial": true}
  ],
  "startNodeId": "s1",
  "nodes": [
    {
      "id": "s1",
      "act": "第一幕",
      "title": "节点标题",
      "location": "地点",
      "time": "时间",
      "weather": "天气或氛围",
      "summary": "这个节点发生什么，玩家要做什么选择",
      "isEnding": false,
      "endingType": "none",
      "choices": [
        {"text": "选项文字", "to": "s2", "effects": {"hp": -3, "insight": 1}, "items": [], "requires": null},
        {"text": "另一个选项", "to": "e1", "effects": {}, "items": []}
      ]
    },
    {
      "id": "s2",
      "act": "第二幕",
      "title": "节点标题",
      "location": "地点",
      "time": "时间",
      "weather": "氛围",
      "summary": "节点内容",
      "isEnding": false,
      "endingType": "none",
      "choices": [
        {"text": "走向结局 A", "to": "e1", "effects": {}},
        {"text": "走向结局 B", "to": "e1", "effects": {}}
      ]
    },
    {
      "id": "e1",
      "act": "结局",
      "title": "结局标题",
      "location": "地点",
      "time": "时间",
      "weather": "氛围",
      "summary": "结局内容概述",
      "isEnding": true,
      "endingType": "good",
      "choices": []
    }
  ]
}"""

SYSTEM_WRITER = """你是 EchoQuest 的“剧情撰写 Agent”。你会收到用户背景、故事圣经，以及一个已经设计好的专属节点流程。请把它写成完整、可玩的中文互动小说。

必须遵守：
1. 严格保留故事流程中的节点 ID、节点数量、选项数量和选项走向，不得增加、删除或合并节点。
2. 每个节点的 choices 只提供 text 和 note，顺序必须与规划完全一致；不要改 to、不要写 effects。
3. n0 不存在，不要使用任何固定节点命名。按输入中的节点 ID 输出。
4. 故事必须贴合用户背景；如果背景里没有信、灯塔或失踪者，禁止擅自加入。
5. 每个非结局节点写 2–4 段，每段 30–110 个汉字；结局写 3 段左右。
6. 每个节点提供 2 条 echo 氛围续写，供自由行动使用。
7. 选项文字不超过 36 字，note 不超过 20 字。
8. 保持人物动机、地点、物品和后果前后一致；不同选择必须有不同后果，不要只是换一种说法。
9. 不要输出 Markdown、代码围栏、解释或任何 JSON 之外的文字。
10. 禁止色情、仇恨、自残教程、真实暴力教程。

输出 JSON：
{
  "nodes": {
    "s1": {
      "title": "节点标题",
      "location": "地点",
      "time": "时间",
      "weather": "氛围",
      "text": ["第一段", "第二段"],
      "echo": ["氛围续写 1", "氛围续写 2"],
      "choices": [{"text": "选项文字", "note": "选项提示"}]
    },
    "e1": {
      "title": "结局标题",
      "location": "地点",
      "time": "时间",
      "weather": "氛围",
      "text": ["结局段落"],
      "echo": ["回响 1", "回响 2"],
      "quote": "结局引语",
      "choices": []
    }
  }
}"""

SYSTEM_REPAIR = """你是 EchoQuest 的“剧情修复 Agent”。你会收到故事圣经、原始节点流程、待修复的 nodes JSON，以及校验器发现的问题列表。

请修复 JSON 结构和文本，使其与规划中的节点数量、节点 ID、选项数量完全一致；不要改变故事圣经、人物、地点、核心冲突和已经写好的有效内容。

只输出修复后的完整 JSON：
{"nodes": {...}}

不要输出 Markdown、代码围栏、解释。禁止色情、仇恨、自残教程、真实暴力教程。"""


def load_config():
    """Load API credentials from environment variables or the secret file."""
    config = {}
    if SECRET_FILE.exists():
        try:
            config = json.loads(SECRET_FILE.read_text(encoding="utf-8-sig"))
        except (OSError, ValueError) as exc:
            print("[config] cannot parse .secrets/api.json:", exc)
    api_key = os.environ.get("ECHOQUEST_API_KEY") or config.get("apiKey") or ""
    base_url = os.environ.get("ECHOQUEST_BASE_URL") or config.get("baseUrl") or "https://api.deepseek.com/v1"
    model = os.environ.get("ECHOQUEST_MODEL") or config.get("model") or "deepseek-chat"
    return {
        "apiKey": api_key,
        "baseUrl": str(base_url).rstrip("/"),
        "model": model,
        "jsonMode": bool(config.get("jsonMode", False)),
    }


CONFIG = load_config()


def now_ms():
    """Return the current Unix time in milliseconds."""
    return int(time.time() * 1000)


def safe_log(message):
    """Print a log line without Authorization headers or API keys."""
    print("[echoquest]", message, flush=True)


class RateLimiter:
    """Per-IP, per-endpoint in-memory rate limiter."""

    def __init__(self):
        """Create empty rate-limit buckets for the current day."""
        self.lock = threading.Lock()
        self.buckets = defaultdict(deque)
        self.day = time.strftime("%Y-%m-%d")
        self.daily_total = 0

    def check(self, ip, bucket):
        """Return whether a request is allowed and a user-facing reason."""
        today = time.strftime("%Y-%m-%d")
        with self.lock:
            if today != self.day:
                self.day = today
                self.daily_total = 0
            if self.daily_total >= DAILY_LIMIT:
                return False, "今日生成额度已用完，请明天再来。"
            key = (ip, bucket)
            queue = self.buckets[key]
            cutoff = time.time() - 3600
            while queue and queue[0] < cutoff:
                queue.popleft()
            if len(queue) >= RATE_LIMIT_PER_HOUR:
                return False, "生成太频繁了，请稍后再试。"
            queue.append(time.time())
            self.daily_total += 1
            return True, ""

    def finish_generation(self):
        """Reserve one additional daily call (used by future async flows)."""
        with self.lock:
            self.daily_total += 1


LIMITER = RateLimiter()
AI_SEMAPHORE = threading.BoundedSemaphore(3)


def extract_json(text):
    """Extract a JSON object from model text, tolerating fences and trailing commas."""
    value = str(text or "").strip()
    value = re.sub(r"^```(?:json)?\s*", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*```$", "", value)
    start = value.find("{")
    end = value.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("模型没有返回 JSON 对象")
    raw = value[start:end + 1]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        cleaned = re.sub(r",(\s*[}\]])", r"\1", raw)
        return json.loads(cleaned)


class EchoQuestError(Exception):
    """Expected, client-facing API error."""

    def __init__(self, message, status=500, code="INTERNAL_ERROR", retryable=False):
        super().__init__(message)
        self.status = status
        self.code = code
        self.retryable = retryable


class UpstreamError(EchoQuestError):
    """An error returned by the upstream language-model service."""

    def __init__(self, message, code="UPSTREAM_ERROR", retryable=True):
        super().__init__(message, status=502, code=code, retryable=retryable)


@contextmanager
def ai_slot():
    """Acquire a model-call concurrency slot for the duration of a request."""
    if not AI_SEMAPHORE.acquire(blocking=False):
        raise EchoQuestError("当前生成任务较多，请稍后再试。", 429, "AI_BUSY")
    try:
        yield
    finally:
        AI_SEMAPHORE.release()


def _sanitize_error(exc):
    """Strip secrets from an exception before logging or returning it."""
    message = str(exc)
    key = CONFIG.get("apiKey") or ""
    if key:
        message = message.replace(key, "[REDACTED]")
    return message[:240]


def _llm_endpoint():
    """Return the normalized upstream chat-completions URL."""
    endpoint = CONFIG["baseUrl"].rstrip("/")
    if not endpoint.endswith("/chat/completions"):
        endpoint += "/chat/completions"
    return endpoint


def _llm_payload(system_prompt, user_prompt, max_tokens, temperature):
    """Build the OpenAI-compatible request body."""
    payload = {
        "model": CONFIG["model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": int(max_tokens),
        "stream": False,
    }
    if CONFIG.get("jsonMode"):
        payload["response_format"] = {"type": "json_object"}
    return payload


def _request_llm(payload):
    """Execute one upstream request and normalize its response."""
    request = urllib.request.Request(
        _llm_endpoint(),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + CONFIG["apiKey"],
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    started = now_ms()
    try:
        with urllib.request.urlopen(request, timeout=150) as response:
            body = response.read().decode("utf-8", errors="replace")
            data = json.loads(body)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        safe_log("upstream error " + str(exc.code) + " " + detail[:200].replace(CONFIG["apiKey"], "[REDACTED]"))
        retryable = exc.code in (429, 500, 502, 503, 504)
        raise UpstreamError("模型接口错误（" + str(exc.code) + "）", "UPSTREAM_HTTP", retryable) from exc
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        raise UpstreamError("模型接口异常：" + _sanitize_error(exc), "UPSTREAM_IO", True) from exc

    choices = data.get("choices") or []
    message = choices[0].get("message", {}) if choices else {}
    content = message.get("content", "")
    if not content:
        raise UpstreamError("模型返回了空内容", "EMPTY_RESPONSE", True)
    return {
        "text": content,
        "usage": data.get("usage") or {},
        "model": data.get("model") or CONFIG["model"],
        "latencyMs": now_ms() - started,
    }


def call_llm(system_prompt, user_prompt, max_tokens=3000, temperature=0.8):
    """Call the upstream model once, retrying transient failures once."""
    if not CONFIG["apiKey"]:
        raise UpstreamError("服务器尚未配置 API Key", "NO_API_KEY", False)
    payload = _llm_payload(system_prompt, user_prompt, max_tokens, temperature)
    for attempt in range(2):
        try:
            return _request_llm(payload)
        except UpstreamError as exc:
            if exc.retryable and attempt == 0:
                time.sleep(2)
                continue
            raise
    raise UpstreamError("模型服务暂不可用", "UPSTREAM_UNAVAILABLE", False)


def plan_nodes(data):
    """Return the plan node list if the payload has one."""
    nodes = data.get("nodes") if isinstance(data, dict) else None
    return nodes if isinstance(nodes, list) else []


def _plan_graph(nodes):
    """Build adjacency and indegree maps for the story graph."""
    ids = [str(node["id"]) for node in nodes if isinstance(node, dict) and node.get("id")]
    index = {node_id: position for position, node_id in enumerate(ids)}
    adjacency = {node_id: [] for node_id in ids}
    indegree = {node_id: 0 for node_id in ids}
    for node in nodes:
        if not isinstance(node, dict):
            continue
        source = str(node.get("id") or "")
        if source not in index:
            continue
        for choice in node.get("choices") or []:
            target = str(choice.get("to") or "") if isinstance(choice, dict) else ""
            if target in index and target != source:
                adjacency[source].append(target)
                indegree[target] += 1
    return ids, index, adjacency, indegree


def _topological_order(start, ids, index, adjacency, indegree):
    """Return a stable topological order, or an incomplete list on cycles."""
    ready = [node_id for node_id in ids if indegree[node_id] == 0]
    if start in ready:
        ready.remove(start)
        ready.insert(0, start)
    ordered = []
    while ready:
        ready.sort(key=lambda node_id: index.get(node_id, 0))
        current = ready.pop(0)
        ordered.append(current)
        for target in adjacency.get(current, []):
            indegree[target] -= 1
            if indegree[target] == 0:
                ready.append(target)
    return ordered


def normalize_plan_order(data):
    """Reorder plan nodes topologically without changing story content."""
    if not isinstance(data, dict) or not isinstance(data.get("nodes"), list):
        return data
    nodes = [node for node in data["nodes"] if isinstance(node, dict) and node.get("id")]
    if len(nodes) < 2:
        return data
    ids, index, adjacency, indegree = _plan_graph(nodes)
    start = str(data.get("startNodeId") or ids[0])
    ordered = _topological_order(start, ids, index, adjacency, indegree)
    if len(ordered) == len(ids):
        by_id = {str(node["id"]): node for node in nodes}
        data["nodes"] = [by_id[node_id] for node_id in ordered]
    return data


def _missing_field_issues(data):
    """Return issues for missing top-level blueprint fields."""
    issues = []
    for key in ("title", "subtitle", "synopsis", "nodes", "startNodeId", "characters"):
        if key not in data or not data.get(key):
            issues.append("缺少字段 " + key)
    return issues


def _collect_positions(nodes):
    """Collect unique node IDs and their positions."""
    positions = {}
    issues = []
    for position, node in enumerate(nodes):
        if not isinstance(node, dict):
            issues.append("第 " + str(position + 1) + " 个节点不是对象")
            continue
        node_id = str(node.get("id") or "").strip()
        if not node_id:
            issues.append("第 " + str(position + 1) + " 个节点缺少 id")
        elif node_id in positions:
            issues.append("节点 id 重复：" + node_id)
        else:
            positions[node_id] = position
    return positions, issues


def _choice_issue(node_id, choice, positions):
    """Validate one choice edge and return an issue string or None."""
    if not isinstance(choice, dict):
        return node_id + " 的选项不是对象"
    target = str(choice.get("to") or "").strip()
    if target not in positions:
        return node_id + " 的选项指向不存在的节点 " + target
    if positions[target] <= positions[node_id]:
        return node_id + " 的选项必须指向后续节点"
    return None


def _non_ending_issues(node, positions):
    """Validate the choices of one non-ending node."""
    node_id = str(node.get("id"))
    choices = node.get("choices") if isinstance(node.get("choices"), list) else []
    issues = []
    if not 2 <= len(choices) <= 4:
        issues.append(node_id + " 需要 2–4 个选项，目前 " + str(len(choices)))
    for choice in choices:
        issue = _choice_issue(node_id, choice, positions)
        if issue:
            issues.append(issue)
    return issues


def _ending_issues(node):
    """Validate one ending node."""
    node_id = str(node.get("id"))
    issues = []
    if node.get("choices"):
        issues.append(node_id + " 是结局，不应有选项")
    if node.get("endingType") not in ("good", "bad", "hidden"):
        issues.append(node_id + " 缺少合法 endingType")
    return issues


def _validate_choices_and_endings(nodes, positions):
    """Validate choice counts, targets and ending metadata."""
    issues = []
    for node in nodes:
        if not isinstance(node, dict) or str(node.get("id")) not in positions:
            continue
        issues.extend(_ending_issues(node) if node.get("isEnding") else _non_ending_issues(node, positions))
    return issues


def _validate_reachability(nodes, start_id, positions):
    """Validate that all nodes are reachable from the start node."""
    if start_id not in positions:
        return []
    node_by_id = {str(node.get("id")): node for node in nodes if isinstance(node, dict)}
    reachable = {start_id}
    queue = deque([start_id])
    while queue:
        current = queue.popleft()
        for choice in node_by_id.get(current, {}).get("choices") or []:
            target = str(choice.get("to") or "") if isinstance(choice, dict) else ""
            if target in positions and target not in reachable:
                reachable.add(target)
                queue.append(target)
    missing = set(positions) - reachable
    if not missing:
        return []
    return ["存在从起点不可达的节点：" + "、".join(sorted(missing)[:5])]


def _validate_endings(nodes, ending_count):
    """Validate ending count and ending-type coverage."""
    endings = [node for node in nodes if isinstance(node, dict) and node.get("isEnding")]
    issues = []
    if len(endings) != ending_count:
        issues.append("结局数量应为 " + str(ending_count) + "，目前 " + str(len(endings)))
    if ending_count == 3:
        types = {node.get("endingType") for node in endings}
        for required_type in ("good", "bad", "hidden"):
            if required_type not in types:
                issues.append("三个结局缺少 " + required_type + " 结局")
    return issues


def _validate_branching(nodes):
    """Require at least two genuine branch points."""
    branch_points = sum(
        1 for node in nodes
        if isinstance(node, dict) and not node.get("isEnding") and len(node.get("choices") or []) >= 2
    )
    return [] if branch_points >= 2 else ["至少需要 2 个真正的分支节点"]


def _validate_characters(data):
    """Validate that the blueprint has at least two characters."""
    characters = data.get("characters")
    if isinstance(characters, list) and len(characters) >= 2:
        return []
    return ["角色少于 2 个"]


def validate_bible(data, ending_count, length_key="medium"):
    """Validate a dynamic story blueprint, including graph reachability."""
    if not isinstance(data, dict):
        return ["故事圣经不是对象"]
    issues = _missing_field_issues(data)
    nodes = plan_nodes(data)
    if len(nodes) < 2:
        return issues + ["故事流程至少需要 2 个节点"]
    ranges = {"short": (5, 9), "medium": (7, 13), "long": (10, 18)}
    low, high = ranges.get(length_key, (7, 13))
    if len(nodes) < low or len(nodes) > high:
        issues.append("节点数 " + str(len(nodes)) + " 不在建议范围 " + str(low) + "–" + str(high) + " 内")
    positions, position_issues = _collect_positions(nodes)
    issues.extend(position_issues)
    start_id = str(data.get("startNodeId") or "").strip()
    if start_id not in positions:
        issues.append("startNodeId 不在 nodes 中")
    if positions:
        issues.extend(_validate_choices_and_endings(nodes, positions))
        issues.extend(_validate_endings(nodes, ending_count))
        issues.extend(_validate_reachability(nodes, start_id, positions))
        issues.extend(_validate_branching(nodes))
    issues.extend(_validate_characters(data))
    return issues


def _written_node_issues(node_id, planned, written):
    """Validate one written node against its plan entry."""
    if not isinstance(written, dict):
        return ["缺少节点 " + node_id]
    issues = []
    text = written.get("text")
    if not isinstance(text, list) or not text or not any(str(item).strip() for item in text):
        issues.append(node_id + " 的剧情文本为空")
    expected_choices = 0 if planned.get("isEnding") else len(planned.get("choices") or [])
    choices = written.get("choices")
    if not isinstance(choices, list):
        issues.append(node_id + " 的 choices 不是数组")
    else:
        if len(choices) != expected_choices:
            issues.append(
                node_id + " 需要 " + str(expected_choices) + " 个选项，正文给了 " + str(len(choices)) + " 个"
            )
        if planned.get("isEnding") and choices:
            issues.append(node_id + " 是结局节点，不应该有选项")
    return issues


def validate_nodes(data, bible):
    """Validate written content against a previously validated blueprint."""
    if not isinstance(data, dict) or not isinstance(data.get("nodes"), dict):
        return ["nodes 不是对象"]
    plan = plan_nodes(bible)
    if not plan:
        return ["故事流程为空，无法校验正文"]
    issues = []
    for planned in plan:
        if not isinstance(planned, dict) or not planned.get("id"):
            continue
        node_id = str(planned["id"])
        issues.extend(_written_node_issues(node_id, planned, data["nodes"].get(node_id)))
    return issues


def plan_is_severe(data):
    """Return True when a blueprint is too incomplete to continue."""
    if not isinstance(data, dict):
        return True
    nodes = plan_nodes(data)
    if len(nodes) < 2:
        return True
    ids = {str(node.get("id")) for node in nodes if isinstance(node, dict)}
    return str(data.get("startNodeId") or "") not in ids


def safe_text(value, max_len):
    """Strip and truncate untrusted text."""
    return str(value or "").strip()[:max_len]




_KNOWLEDGE_INDEX = None


def _knowledge_tokens(text):
    """Tokenize Chinese text with character bigrams plus ASCII words."""
    value = str(text or "").lower()
    tokens = []
    for word in re.findall(r"[a-z0-9_]{2,}", value):
        tokens.append(word)
    for sequence in re.findall(r"[\u4e00-\u9fff]+", value):
        if len(sequence) == 1:
            tokens.append(sequence)
        else:
            tokens.extend(sequence[index:index + 2] for index in range(len(sequence) - 1))
    return tokens



def _hash_vector(tokens, dimensions=128):
    """Create a small local feature-hash vector without external embeddings."""
    vector = [0.0] * dimensions
    for token in tokens:
        vector[hash(token) % dimensions] += 1.0
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


def _cosine(left, right):
    """Cosine similarity for normalized hash vectors."""
    return sum(a * b for a, b in zip(left, right))


def _load_knowledge_index():
    """Build a small BM25 index from local Markdown knowledge files."""
    global _KNOWLEDGE_INDEX
    if _KNOWLEDGE_INDEX is not None:
        return _KNOWLEDGE_INDEX
    chunks = []
    if KNOWLEDGE_DIR.exists():
        for path in sorted(KNOWLEDGE_DIR.rglob("*.md")):
            if path.name.lower() == "readme.md":
                continue
            source = path.relative_to(ROOT).as_posix()
            title = path.stem
            for block in re.split(r"\n\s*\n", path.read_text(encoding="utf-8")):
                block = block.strip()
                if len(block) < 40:
                    continue
                first = block.splitlines()[0].strip()
                if first.startswith("#"):
                    title = first.lstrip("#").strip() or title
                tokens = _knowledge_tokens(block)
                if not tokens:
                    continue
                chunks.append({
                    "id": f"{source}#{len(chunks)}",
                    "title": title,
                    "source": source,
                    "group": path.parent.name,
                    "text": block,
                    "tokens": tokens,
                    "tf": Counter(tokens),
                    "vector": _hash_vector(tokens),
                })
    document_frequency = Counter()
    for chunk in chunks:
        for term in chunk["tf"]:
            document_frequency[term] += 1
    average_length = sum(len(chunk["tokens"]) for chunk in chunks) / len(chunks) if chunks else 0
    _KNOWLEDGE_INDEX = {
        "chunks": chunks,
        "df": document_frequency,
        "avgdl": average_length,
    }
    return _KNOWLEDGE_INDEX


def search_knowledge(query, top_k=3):
    """Hybrid demo retrieval: BM25 + hashed vector + same-topic graph boost."""
    tokens = _knowledge_tokens(query)
    if not tokens:
        return []
    index = _load_knowledge_index()
    chunks = index["chunks"]
    if not chunks:
        return []
    document_frequency = index["df"]
    total = len(chunks)
    average_length = index["avgdl"] or 1
    query_terms = list(dict.fromkeys(tokens))
    query_vector = _hash_vector(tokens)
    candidates = []
    for chunk in chunks:
        length = len(chunk["tokens"]) or 1
        bm25 = 0.0
        for term in query_terms:
            frequency = chunk["tf"].get(term, 0)
            if not frequency:
                continue
            idf = math.log(1 + (total - document_frequency[term] + 0.5) / (document_frequency[term] + 0.5))
            denominator = frequency + 1.5 * (1 - 0.75 + 0.75 * length / average_length)
            bm25 += idf * frequency * 2.5 / denominator
        candidates.append({
            "chunk": chunk,
            "bm25": bm25,
            "vector": _cosine(query_vector, chunk["vector"]),
        })
    if not candidates:
        return []
    max_bm25 = max(item["bm25"] for item in candidates) or 1.0
    top_group = max(
        candidates,
        key=lambda item: 0.65 * item["bm25"] / max_bm25 + 0.25 * item["vector"],
    )["chunk"].get("group", "")
    ranked = []
    for item in candidates:
        chunk = item["chunk"]
        graph = 1.0 if chunk.get("group") == top_group else 0.0
        score = 0.65 * item["bm25"] / max_bm25 + 0.25 * item["vector"] + 0.10 * graph
        if score > 0:
            ranked.append({
                "id": chunk["id"],
                "title": chunk["title"],
                "source": chunk["source"],
                "group": chunk.get("group", ""),
                "score": round(score, 4),
                "bm25": round(item["bm25"], 4),
                "vector": round(item["vector"], 4),
                "graph": graph,
                "text": chunk["text"],
            })
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:max(1, min(int(top_k or 3), 6))]


def _knowledge_for(payload, extra=""):
    """Retrieve knowledge for one generation stage."""
    query = " ".join([
        safe_text(payload.get("background", ""), 2000),
        str(payload.get("genreLabel") or payload.get("genre") or ""),
        str(payload.get("tone") or ""),
        str(extra or ""),
    ])
    return search_knowledge(query, 3)


def _public_knowledge(items):
    """Return citation-safe knowledge metadata without full text."""
    return [
        {"id": item["id"], "title": item["title"], "source": item["source"], "score": item["score"]}
        for item in items
    ]



def load_tool_whitelist():
    """Load and validate the fixed tool allowlist from tools/whitelist.json."""
    if not TOOLS_FILE.is_file():
        raise RuntimeError("missing tools/whitelist.json")
    try:
        data = json.loads(TOOLS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RuntimeError("cannot parse tools/whitelist.json: " + str(exc)) from exc
    if not isinstance(data, dict) or data.get("version") != 1:
        raise RuntimeError("tools/whitelist.json must be version 1")
    tools = data.get("tools")
    if not isinstance(tools, list) or not tools:
        raise RuntimeError("tools/whitelist.json has no tools")
    allowed_modes = {"llm", "read", "write"}
    names = set()
    endpoints = set()
    result = []
    for item in tools:
        if not isinstance(item, dict):
            raise RuntimeError("tool entry must be an object")
        name = str(item.get("name") or "").strip()
        endpoint = str(item.get("endpoint") or "").strip()
        handler = str(item.get("handler") or "").strip()
        mode = str(item.get("mode") or "").strip()
        scopes = item.get("scopes")
        if not name or name in names:
            raise RuntimeError("tool name missing or duplicated: " + name)
        if not endpoint.startswith("/api/") or endpoint in endpoints:
            raise RuntimeError("tool endpoint invalid or duplicated: " + endpoint)
        if not handler.startswith("_handle_"):
            raise RuntimeError("tool handler not allowed: " + handler)
        if mode not in allowed_modes:
            raise RuntimeError("tool mode invalid: " + mode)
        if not isinstance(scopes, list) or not all(isinstance(scope, str) for scope in scopes):
            raise RuntimeError("tool scopes must be a string array: " + name)
        names.add(name)
        endpoints.add(endpoint)
        result.append({
            "name": name,
            "endpoint": endpoint,
            "method": "POST",
            "handler": handler,
            "mode": mode,
            "scopes": list(scopes),
        })
    return result


TOOL_WHITELIST = load_tool_whitelist()

def build_architect_prompt(payload):
    """Build the architect prompt payload."""
    return json.dumps({
        "用户故事背景": payload.get("background", ""),
        "用户选择的类型": payload.get("genreLabel", ""),
        "情绪基调": payload.get("tone", ""),
        "剧情长度": payload.get("length", "medium"),
        "结局数量": payload.get("endingCount", 3),
        "角色属性": bool(payload.get("statsEnabled", True)),
        "重点": "先判断故事本身最适合什么互动结构。不要默认使用信件、灯塔、失踪者或检查物件。让分支来自人物关系、目标冲突和世界规则。输出一个专属于这段背景的节点流程。",
        "参考资料": payload.get("knowledge", [])
    }, ensure_ascii=False)


def build_writer_prompt(payload):
    """Build the writer prompt payload."""
    return json.dumps({
        "用户故事背景": payload.get("background", ""),
        "故事圣经与节点流程": payload.get("bible", {}),
        "结局数量": payload.get("endingCount", 3),
        "要求": "按输入中的节点 ID 和选项数量逐个写正文。不要改变节点数量、ID、选项数量和选项走向。不要擅自加入信件、灯塔或失踪者。输出 JSON。",
        "参考资料": payload.get("knowledge", [])
    }, ensure_ascii=False)


def build_repair_prompt(payload):
    """Build the repair prompt payload."""
    return json.dumps({
        "用户故事背景": payload.get("background", ""),
        "故事圣经与节点流程": payload.get("bible", {}),
        "待修复 nodes": payload.get("nodes", {}),
        "校验问题": payload.get("issues", []),
        "结局数量": payload.get("endingCount", 3),
        "要求": "输出修复后的完整 {\"nodes\": {...}} JSON。节点 ID、节点数量、选项数量必须与节点流程一致。保留原设定和已有内容。"
    }, ensure_ascii=False)


class Handler(BaseHTTPRequestHandler):
    """Static-file and Agent API request handler."""

    server_version = "EchoQuestServer/1.0"
    protocol_version = "HTTP/1.1"
    AGENT_ROUTES = {item["endpoint"]: item for item in TOOL_WHITELIST}

    def log_message(self, fmt, *args):  # pylint: disable=arguments-differ
        """Route access logs through the redacting logger."""
        safe_log(f"{self.client_address[0]} - {fmt % args}")

    def _send_json(self, status, data):
        """Send a JSON response."""
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        """Read a size-limited JSON request body."""
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BODY:
            raise ValueError("请求体为空或过大")
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _same_origin(self):
        """Reject browser calls from a different origin."""
        origin = self.headers.get("Origin")
        if not origin:
            return True
        parsed = urllib.parse.urlparse(origin)
        host = (self.headers.get("Host") or "").split(":")[0]
        return parsed.hostname == host or parsed.hostname in ALLOWED_ORIGIN_HOSTS

    def _client_ip(self):
        """Return the client IP, trusting Nginx's forwarded headers."""
        forwarded = self.headers.get("X-Real-IP")
        if forwarded:
            return forwarded.strip()
        chain = self.headers.get("X-Forwarded-For")
        if chain:
            return chain.split(",")[0].strip()
        return self.client_address[0]

    def do_GET(self):  # pylint: disable=invalid-name
        """Serve health checks and static assets."""
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/tools":
            self._send_json(200, {
                "ok": True,
                "tools": [
                    {"name": item["name"], "endpoint": item["endpoint"], "mode": item["mode"], "scopes": item["scopes"]}
                    for item in TOOL_WHITELIST
                ],
            })
            return
        if path == "/api/health":
            self._send_json(200, {
                "ok": True,
                "ai": bool(CONFIG["apiKey"]),
                "model": CONFIG["model"],
                "provider": "openai-compatible",
            "rag": bool(_load_knowledge_index()["chunks"]),
            })
            return
        if path == "/":
            path = "/index.html"
        if path == "/index.html":
            self._serve_file(ROOT / "index.html", "text/html; charset=utf-8")
            return
        if path.startswith("/assets/"):
            rel = path[len("/assets/"):]
            if not rel or ".." in rel or rel.startswith("."):
                self._send_json(404, {"ok": False, "error": "Not found"})
                return
            self._serve_file(ROOT / "assets" / rel)
            return
        self._send_json(404, {"ok": False, "error": "Not found"})

    def _serve_file(self, path, content_type=None):
        """Serve a static file without escaping the project root."""
        try:
            path = path.resolve()
            if ROOT.resolve() not in path.parents and path != ROOT.resolve():
                raise FileNotFoundError
            if not path.is_file():
                raise FileNotFoundError
            body = path.read_bytes()
            ctype = content_type or mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            if str(path).endswith(".svg"):
                ctype = "image/svg+xml"
            if str(path).endswith(".js"):
                ctype = "application/javascript; charset=utf-8"
            if str(path).endswith(".css"):
                ctype = "text/css; charset=utf-8"
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            cache = "public, max-age=3600" if str(path).endswith((".svg", ".css", ".js")) else "no-cache"
            self.send_header("Cache-Control", cache)
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)
        except FileNotFoundError:
            self._send_json(404, {"ok": False, "error": "Not found"})

    def _story_context(self, payload):
        """Validate shared request fields for agent calls."""
        raw_background = safe_text(payload.get("background", ""), 2000)
        if not raw_background:
            raise EchoQuestError("缺少故事背景", 400, "MISSING_BACKGROUND")
        inspected = inspect_text(raw_background)
        if not inspected["ok"]:
            raise EchoQuestError("背景包含不适合当前模式的内容", 400, "CONTENT_BLOCKED")
        background = inspected["redacted"]
        try:
            ending_count = 1 if int(payload.get("endingCount", 3)) == 1 else 3
        except (TypeError, ValueError) as exc:
            raise EchoQuestError("endingCount 必须是整数", 400, "INVALID_ENDING_COUNT") from exc
        length_key = str(payload.get("length") or "medium")
        return background, ending_count, length_key

    @staticmethod
    def _result_meta(result, stage, started):
        """Build a standard response metadata object."""
        return {
            "stage": stage,
            "latencyMs": now_ms() - started,
            "usage": result.get("usage", {}),
            "model": result.get("model", ""),
        }

    def _handle_architect(self, payload):
        """Generate and validate a dynamic story blueprint."""
        _, ending_count, length_key = self._story_context(payload)
        knowledge = _knowledge_for(payload)
        enriched = dict(payload)
        enriched["knowledge"] = knowledge
        started = now_ms()
        result = call_llm(SYSTEM_ARCHITECT, build_architect_prompt(enriched), max_tokens=3800, temperature=0.85)
        data = normalize_plan_order(extract_json(result["text"]))
        issues = validate_bible(data, ending_count, length_key)
        severe = plan_is_severe(data)
        meta = self._result_meta(result, "architect", started)
        meta["knowledge"] = _public_knowledge(knowledge)
        self._send_json(200, {
            "ok": not severe,
            "severe": severe,
            "data": data,
            "issues": issues,
            "meta": meta,
        })

    def _handle_write(self, payload):
        """Write node content from a validated blueprint."""
        self._story_context(payload)
        bible = payload.get("bible")
        if not isinstance(bible, dict):
            raise EchoQuestError("缺少故事圣经", 400, "MISSING_BIBLE")
        knowledge = _knowledge_for(payload, str(bible.get("synopsis") or ""))
        enriched = dict(payload)
        enriched["knowledge"] = knowledge
        started = now_ms()
        result = call_llm(SYSTEM_WRITER, build_writer_prompt(enriched), max_tokens=6400, temperature=0.9)
        data = extract_json(result["text"])
        issues = validate_nodes(data, bible)
        meta = self._result_meta(result, "write", started)
        meta["knowledge"] = _public_knowledge(knowledge)
        self._send_json(200, {
            "ok": True,
            "data": data,
            "issues": issues,
            "meta": meta,
        })

    def _handle_repair(self, payload):
        """Repair node content after validator issues."""
        self._story_context(payload)
        bible = payload.get("bible")
        nodes = payload.get("nodes")
        if not isinstance(bible, dict) or not isinstance(nodes, dict):
            raise EchoQuestError("缺少待修复数据", 400, "MISSING_REPAIR_DATA")
        started = now_ms()
        result = call_llm(SYSTEM_REPAIR, build_repair_prompt(payload), max_tokens=6400, temperature=0.3)
        data = extract_json(result["text"])
        issues = validate_nodes(data, bible)
        self._send_json(200, {
            "ok": True,
            "data": data,
            "issues": issues,
            "meta": self._result_meta(result, "repair", started),
        })


    def _handle_knowledge_search(self, payload):
        """Retrieve local story knowledge for debugging and demos."""
        query = safe_text(payload.get("query", ""), 500)
        if not query:
            raise EchoQuestError("缺少检索内容", 400, "MISSING_QUERY")
        try:
            top_k = int(payload.get("topK", 3))
        except (TypeError, ValueError) as exc:
            raise EchoQuestError("topK 必须是整数", 400, "INVALID_TOP_K") from exc
        results = search_knowledge(query, top_k)
        self._send_json(200, {
            "ok": True,
            "data": results,
            "meta": {"count": len(results)},
        })


    def _handle_agent_plan(self, payload):
        """Return a Plan-and-Solve execution plan for a story job."""
        self._story_context(payload)
        self._send_json(200, {"ok": True, "data": build_plan(payload)})

    def _handle_tool_route(self, payload):
        """Rule-based demo routing; not model-autonomous tool calling."""
        text = safe_text(payload.get("text", ""), 500)
        if not text:
            raise EchoQuestError("缺少路由文本", 400, "MISSING_ROUTE_TEXT")
        self._send_json(200, {"ok": True, "data": route_tool(text)})

    def _handle_memory_save(self, payload):
        """Persist a game payload in the demo SQLite memory store."""
        game_id = safe_text(payload.get("gameId", ""), 80)
        title = safe_text(payload.get("title", ""), 120)
        game_payload = payload.get("payload")
        if not game_id or not title or not isinstance(game_payload, dict):
            raise EchoQuestError("缺少 gameId/title/payload", 400, "INVALID_MEMORY_PAYLOAD")
        size = memory_store.save_game(game_id, title, game_payload)
        self._send_json(200, {
            "ok": True,
            "data": {"gameId": game_id, "title": title, "bytes": size},
            "meta": {"store": "sqlite-demo"},
        })

    def _handle_memory_load(self, payload):
        """Load a game payload from the demo SQLite memory store."""
        game_id = safe_text(payload.get("gameId", ""), 80)
        if not game_id:
            raise EchoQuestError("缺少 gameId", 400, "MISSING_GAME_ID")
        game = memory_store.load_game(game_id)
        if not game:
            raise EchoQuestError("作品不存在", 404, "GAME_NOT_FOUND")
        self._send_json(200, {"ok": True, "data": game, "meta": {"store": "sqlite-demo"}})

    def _handle_safety_check(self, payload):
        """Run local PII redaction and keyword moderation."""
        text = safe_text(payload.get("text", ""), 2000)
        if not text:
            raise EchoQuestError("缺少待检查文本", 400, "MISSING_TEXT")
        result = inspect_text(text)
        self._send_json(200, {
            "ok": True,
            "data": result,
            "meta": {"engine": "local-demo"},
        })

    def do_POST(self):  # pylint: disable=invalid-name
        """Handle all Agent API POST routes."""
        path = urllib.parse.urlparse(self.path).path
        tool = self.AGENT_ROUTES.get(path)
        if not tool:
            self._send_json(404, {"ok": False, "error": "Not found"})
            return
        if not self._same_origin():
            self._send_json(403, {"ok": False, "error": "Forbidden origin"})
            return
        allowed, reason = LIMITER.check(self._client_ip(), tool["name"])
        if not allowed:
            self._send_json(429, {"ok": False, "error": reason})
            return
        try:
            with ai_slot():
                payload = self._read_json()
                getattr(self, tool["handler"])(payload)
        except EchoQuestError as exc:
            self._send_json(exc.status, {"ok": False, "error": _sanitize_error(exc), "code": exc.code})
        except (ValueError, KeyError, TypeError) as exc:
            self._send_json(400, {"ok": False, "error": _sanitize_error(exc), "code": "INVALID_REQUEST"})
        except OSError as exc:
            safe_log("agent io error: " + _sanitize_error(exc))
            self._send_json(502, {"ok": False, "error": "上游服务暂不可用", "code": "UPSTREAM_UNAVAILABLE"})


def main():
    """Start the HTTP server."""
    if not CONFIG["apiKey"]:
        safe_log("WARNING: no API key configured; AI endpoints will fail and the client will use local fallback.")
    safe_log(f"serving on http://{HOST}:{PORT}")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
