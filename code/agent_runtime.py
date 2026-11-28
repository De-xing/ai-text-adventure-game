"""Demo Plan-and-Solve planner and rule-based tool router.

The planner is deterministic: it decomposes one story job into an explicit
dependency graph. The executor is still the existing fixed pipeline; this is a
demo of plan visibility, not a production autonomous planner.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOOLS_FILE = ROOT / "tools" / "whitelist.json"


def load_tools():
    """Load tool names from the fixed whitelist."""
    data = json.loads(TOOLS_FILE.read_text(encoding="utf-8"))
    return {item["name"]: item for item in data["tools"]}


def build_plan(payload):
    """Return an explicit Plan-and-Solve execution plan."""
    tools = load_tools()
    steps = [
        {"id": "analyze", "label": "读取背景与类型", "tool": None, "dependsOn": []},
        {"id": "architect", "label": "生成故事蓝图", "tool": "create_story_blueprint", "dependsOn": ["analyze"]},
        {"id": "validate_plan", "label": "校验拓扑与结局", "tool": None, "dependsOn": ["architect"]},
        {"id": "write", "label": "按图撰写正文", "tool": "write_story_content", "dependsOn": ["validate_plan"]},
        {"id": "validate_content", "label": "校验正文与选项", "tool": None, "dependsOn": ["write"]},
        {"id": "repair", "label": "条件修复", "tool": "repair_story_content", "dependsOn": ["validate_content"], "optional": True},
        {"id": "compile", "label": "编译可玩故事", "tool": None, "dependsOn": ["repair"]},
    ]
    return {
        "strategy": "plan-and-solve",
        "backgroundLength": len(str(payload.get("background") or "")),
        "steps": steps,
        "availableTools": [name for name in tools],
    }


def route_tool(text):
    """Rule-based tool routing for the demo Function Calling layer."""
    value = str(text or "").lower()
    rules = [
        ("repair_story_content", ("修复", "校验", "问题", "repair"), {"issues": []}),
        ("write_story_content", ("撰写", "正文", "续写", "写一段", "write"), {}),
        ("search_story_knowledge", ("知识", "设定", "查询", "检索", "search"), {"query": str(text or ""), "topK": 3}),
        ("create_story_blueprint", ("生成", "创建", "故事", "开始", "create"), {}),
    ]
    for name, keywords, arguments in rules:
        if any(keyword in value for keyword in keywords):
            return {"tool": name, "arguments": arguments, "confidence": 0.86, "mode": "rule-based"}
    return {"tool": "create_story_blueprint", "arguments": {}, "confidence": 0.5, "mode": "fallback"}
