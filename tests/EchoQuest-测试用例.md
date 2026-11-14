# EchoQuest（回响）单元测试与集成测试用例

> 版本 v1.0 ｜ 编制日期 2026-11-14
> 依据：《README.md》《code/frontend/README.md》《docs/requirements/functional_spec.md》《docs/requirements/nonfunctional_spec.md》《docs/software/architecture.md》《code/backend/database/schema.sql》
> 被测系统：可直接游玩的 Web 前端原型（原生 JS，无构建）＋ SQLite 数据模型
> 技术栈：原生 JavaScript / Vitest 2 + jsdom / Playwright / pytest + SQLite 3.35+

---

## 0. 测试范围与策略

### 0.1 被测边界

```text
[浏览器 DOM] ── app.js（路由/页面/存档/游玩）
                  │
                  ├── data.js            题材包、示例作品、buildPackGame
                  ├── story-generator.js 本地剧情引擎（无网络）
                  └── agent-client.js    健康探测 + architect/write/repair + 编译
                          │
                          └── /api/health、/api/agent/*   ← 仓库内未实现（仅契约测试）

[SQLite] schema.sql / init_db.py  ← 31 表 + 4 视图，前端当前不读写
```

| 层 | 文件 | 是否覆盖 | 手法 |
|---|---|---|---|
| 题材包与示例作品 | `code/frontend/js/data.js` | ✅ 单元 | 直接调用 `EchoQuestData.buildPackGame/createCustomGame` |
| 本地剧情引擎 | `code/frontend/js/story-generator.js` | ✅ 单元 | `createCustomGame` 输出结构、确定性、图完整性 |
| Agent 客户端与编译 | `code/frontend/js/agent-client.js` | ✅ 单元 + 集成 | `EchoQuestAgent.compile/generate` + 假 `fetch` |
| 页面、路由、存档、游玩 | `code/frontend/js/app.js` | ✅ 集成 + E2E | Playwright 驱动真实页面；纯函数经测试钩子 |
| SQLite 数据模型 | `code/backend/database/*` | ✅ 结构测试 | pytest + 临时库 |
| 后端四个接口 | 不存在 | ⭕ 契约测试（`skip`） | 按 architecture.md 固化请求/响应契约 |
| C++ 核心引擎 | `code/core_engine/`（空） | ❌ 不覆盖 | 无源码 |
| 真实 LLM 文风质量 | — | ❌ 不覆盖 | 属评测集，不进入 CI |

### 0.2 确定性分层原则

- **必须精确断言**：节点数、结局数、选项目标可达性、属性上下限、存档行数、`localStorage` 键值、路由参数、`fetch` 调用序列。
- **必须交互断言**：Agent 不可用时 `fetch` 只应有一次健康探测；拦截/锁定选项时不得推进节点；预览模式不得写入 `autosave`、`saves`、`endings`。
- **禁止断言整段措辞**：本地剧情文本由模板拼装，只断言包含关系（地点、物件、人物）与长度上限，不断言完整句子。
- **时间与随机必须固定**：`vi.useFakeTimers()` + `vi.setSystemTime()`；`Math.random` 固定为 `0`；本地生成 4.4s 动画用假时钟推进。
- **完全离线**：单元测试禁用网络（`fetch` 默认 reject）；集成/E2E 用 `page.route("**/api/**")` 打桩；不读取任何真实 API Key。

### 0.3 需求追溯矩阵

| 需求 | 名称 | 覆盖用例 |
|---|---|---|
| FR-1.1 | 背景 10–2000 字 | IT-GEN-07/08、NFT-08 |
| FR-1.2 | 类型/长度/结局数/属性参数 | UT-DATA-02/03/04/05、UT-GEN-23/24/27 |
| FR-1.3 | 至少开场＋3 分支＋1 结局 | UT-GEN-21/22/23、UT-AGT-01 |
| FR-1.4 | 流式进度、失败可重试 | IT-GEN-01~05、E2E-09 |
| FR-1.5 | 预览模式 | IT-PLAY-12、E2E-03 |
| FR-1.6 | 单节点重生成/编辑 | IT-STO-05、E2E-03 |
| FR-1.7 | 整局重生成 | IT-GEN-09 |
| FR-2.1/2.2 | 阅读与续写 | IT-PLAY-01/09/10、E2E-06 |
| FR-2.3 | 设定一致性 | UT-AGT-01/05/17、CT-02~05 |
| FR-2.4 | 结局与重开 | IT-PLAY-08、E2E-05 |
| FR-2.5 | 属性影响可见 | UT-APP-10/11、UT-GEN-24 |
| FR-2.6 | 任意节点回退 | IT-SAVE-08、E2E-04 |
| FR-2.7 | 输入/输出合规检查 | ❌ 未实现（D-07） |
| FR-3.1 | 自动存档 | IT-PLAY-04/10、IT-SAVE-01 |
| FR-3.2 | 5 个手动存档位 | IT-SAVE-01~05 |
| FR-3.4 | Markdown 导出 | IT-OPS-01/02 |
| FR-4.x | 账号、审核、限流、统计 | ❌ 未实现（仅 DB 结构） |
| NFR-U-01/02 | 可读性、快捷输入 | E2E-08、IT-PLAY-11/12 |
| NFR-R-02/03 | 模型容错、离线降级 | IT-GEN-04/05、UT-AGT-13/16 |
| NFR-P-01/02 | 本地逻辑、生成延迟 | NFT-02/03/04 |
| NFR-S-01/02/03 | 配置、可测试性、日志 | NFT-04/07、CT-01 |
| NFR-SEC-01/02/04 | 提示注入、长度、代码注入 | IT-SEC-04、NFT-08 |
| NFR-SEC-03/05 | 内容审核、密钥保护 | IT-SEC-05、D-07 |

### 0.4 准入与准出

- **准入**：`python -m http.server 8080` 可启动；`init_db.py` 可重建库；Node ≥ 20。
- **准出**：非 `xfail` 的 P0 全绿；单元行覆盖率 ≥ 70%（`story-generator`/`agent-client` ≥ 80%，`app.js` 以 E2E 覆盖为主）；无 P0/P1 级新缺陷。

---

## 1. 测试环境与测试替身

### 1.1 环境矩阵

| 项 | 单元 | 集成/E2E | 数据库 |
|---|---|---|---|
| 运行时 | Node 20 + Vitest 2 + jsdom 25 | Playwright 1.47（Chromium/Firefox/WebKit） | Python 3.11 / SQLite 3.35+ |
| 服务 | 无 | `python -m http.server 8080` | 临时 `tmp_path/echoquest.db` |
| 网络 | 禁止 | `/api/**` 全部 `page.route` 打桩 | 无 |
| 时间 | `vi.useFakeTimers()` | `page.clock.install()` | 真实时间 |
| 随机 | `Math.random = () => 0` | 同上（`addInitScript`） | 无 |
| 数据 | 内存/常量夹具 | `localStorage.clear()` 后注入 | `schema.sql` |
| 标记 | `*.unit.test.js` | `*.e2e.spec.js` / `*.it.spec.js` | `pytest -m db` |
| 预算 | 单例 < 100ms，全套 < 10s | 单例 < 15s | 单例 < 1s |

### 1.2 目录与加载顺序

```text
tests/
├── unit/
│   ├── data.unit.test.js            # UT-DATA-01~07
│   ├── generator.unit.test.js       # UT-GEN-01~26
│   ├── agent.unit.test.js           # UT-AGT-01~18
│   └── helpers.unit.test.js         # UT-APP-01~12（需测试钩子）
├── integration/
│   ├── storage.it.spec.js           # IT-STO-01~09
│   ├── generation.it.spec.js        # IT-GEN-01~10
│   ├── play.it.spec.js              # IT-PLAY-01~11
│   ├── saves.it.spec.js             # IT-SAVE-01~07
│   ├── ops.it.spec.js               # IT-OPS-01~06
│   └── security.it.spec.js          # IT-SEC-01~05
├── e2e/smoke.e2e.spec.js            # E2E-01~10
├── contract/api.contract.test.js    # CT-01~07（skip）
├── db/test_schema.py                # DB-01~10
├── fixtures/                        # 见 1.4
└── helpers/core.js
```

`index.html` 的脚本顺序是硬约束：`data.js → story-generator.js → agent-client.js → app.js`。测试加载器必须复刻该顺序，否则 `window.EchoQuestData` 为空时模块会静默 `return`，表现为"函数不存在"而非报错。

### 1.3 关键测试替身

```js
// tests/helpers/core.js —— 在独立 vm 上下文加载三个库脚本
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const FRONTEND = resolve(process.cwd(), "code/frontend");
const CORE = ["js/data.js", "js/story-generator.js", "js/agent-client.js"];

export function loadCore(overrides = {}) {
  const location = overrides.location || { protocol: "http:", hash: "" };
  const sandbox = {
    console,
    Date, Math, JSON, URLSearchParams, setTimeout, clearTimeout,
    location,
    fetch: overrides.fetch || (() => Promise.reject(new Error("network disabled"))),
    localStorage: overrides.localStorage || globalThis.localStorage,
    document: globalThis.document,
    window: {}
  };
  sandbox.window = {
    window: null,
    document: sandbox.document,
    location,
    localStorage: sandbox.localStorage,
    fetch: sandbox.fetch
  };
  sandbox.window.window = sandbox.window;
  const context = vm.createContext(sandbox);
  for (const file of CORE) {
    vm.runInContext(readFileSync(resolve(FRONTEND, file), "utf8"), context, { filename: file });
  }
  return { D: sandbox.window.EchoQuestData, Agent: sandbox.window.EchoQuestAgent, sandbox };
}

// 假 fetch：按 "METHOD path" 路由，未注册路由直接失败
export function stubFetch(routes, calls = []) {
  return async (url, init = {}) => {
    const key = (init.method || "GET") + " " + String(url);
    calls.push({ key, body: init.body ? JSON.parse(init.body) : null, signal: init.signal });
    const handler = routes[key];
    if (!handler) throw new Error("unexpected fetch: " + key);
    const result = typeof handler === "function" ? handler(init.body ? JSON.parse(init.body) : null) : handler;
    return {
      ok: result.status ? result.status < 400 : true,
      status: result.status || 200,
      json: async () => result.body
    };
  };
}
```

```js
// tests/helpers/clock.js —— 每次用例前重置
import { vi } from "vitest";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-14T10:00:00+08:00"));
  vi.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});
```

```js
// code/frontend/js/app.js 末尾新增（仅测试构建可用的钩子，见缺陷 D-01）
  if (new URLSearchParams(window.location.search).has("test")) {
    window.__EQ__ = {
      escapeHtml, narrative, truncate, clamp, parseHash, advanceClock,
      applyChoiceEffects, isChoiceLocked, freshRun, rollbackTo, getGame
    };
  }
```

> `app.js` 是闭合 IIFE，内部函数不导出。UT-APP 系列用例依赖上述 6 行测试钩子（`?test=1` 才生效，不影响生产）；未加钩子时，这些断言只能由 E2E 覆盖。

```js
// tests/integration/helpers.js —— Playwright 公共前置
import { expect } from "@playwright/test";

export async function openApp(page, hash = "#/discover", seed = {}) {
  await page.addInitScript((data) => {
    localStorage.clear();
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    });
    Math.random = () => 0;
  }, seed);
  await page.goto("/" + hash);
  await expect(page.locator("#app")).not.toBeEmpty();
}

export async function stubHealth(page, healthy) {
  await page.route("**/api/health", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(healthy ? { ai: true, model: "stub-model", provider: "stub" } : { ai: false })
    })
  );
}
```

### 1.4 测试数据

| 夹具 | 内容 | 用途 |
|---|---|---|
| `BG_TIME` | `2026 年，我在旧图书馆收到一封来自十年后的信。信里写着：别相信管理员。` | 主题=时间循环、地点/物件/标题派生 |
| `BG_GAME` | `我在旧图书馆登录了一个游戏，收到一封来自未来的信。` | "游戏"关键词优先于"未来" |
| `BG_PLAIN` | `海边的灯塔在暴雨夜亮起，我带着一把旧钥匙回到码头。` | 地点/地标/物件、无显式主题 |
| `BG_CAMPUS` | `毕业前夜，我回到校园的教室，走廊尽头有人在等我。` | 物件兜底、校园主题 |
| `BG_SHORT` | `太短`（2 字） | 预览与创建校验边界 |
| `BG_LONG` | `别` + 100 个汉字 + `。` | 警告语裁剪 |
| `BG_XSS` | `我在旧图书馆收到一封信。<img src=x onerror="window.__xss=1">` | XSS 转义 |
| `BIBLE` | 2 节点：`a`（1 选项→`b`）、`b`（ending/good）；1 角色、1 初始物品、`coverHint:"sea"` | Agent 编译 |
| `RAW_OK` | `a` 正文 2 段 + 1 选项；`b` 终局文案 + 引语 | 正常编译 |
| `RAW_BAD` | `a` 无 choices；缺 `b` 节点 | 校验/修复链路 |
| `STORE_CORRUPT` | `"{not-json"` | 本地数据损坏降级 |

`BIBLE`/`CONFIG` 常量：

```js
export const CONFIG = {
  id: "t1", title: "", background: "海边的灯塔", genre: "suspense",
  tone: "克制", length: "medium", endingCount: 3, statsEnabled: true
};
export const BIBLE = {
  title: "灯塔测试", subtitle: "副标题", startNodeId: "a", theme: "关于回声",
  coverHint: "sea", genreLabel: "悬疑 · 测试",
  nodes: [
    { id: "a", act: "第一幕", title: "开场", summary: "开场摘要", isEnding: false,
      choices: [{ text: "去灯塔", to: "b" }] },
    { id: "b", act: "终幕", title: "终点", summary: "终局摘要", isEnding: true, endingType: "good" }
  ],
  characters: [{ name: "阿青", role: "守灯人", tone: "stranger", desc: "知道真相的人" }],
  items: [{ name: "旧钥匙", desc: "生锈的钥匙", initial: true }],
  statNames: { hp: "生命" }
};
export const RAW_OK = {
  a: { text: ["第一段", "第二段"], choices: [{ text: "走向灯塔", note: "夜色很深" }] },
  b: { text: ["故事结束"], quote: "结束语" }
};
```

### 1.5 执行命令

```bash
# 单元（离线，秒级）
npx vitest run tests/unit --coverage

# 集成 + E2E（先起静态服务器）
python -m http.server 8080 --bind 127.0.0.1 &
npx playwright test tests/integration tests/e2e

# 数据库
pytest tests/db -q

# 契约（后端未实现，默认 skip；实现后去掉 skip）
npx vitest run tests/contract
```

## 2. 单元测试用例

> 目录：`tests/unit/`；全部离线、无 DOM 依赖（UT-APP 除外，需 jsdom + 测试钩子）。
> 断言对象是**数据结构**，不是文案。

### 2.1 `data.js` —— 题材包与示例作品（FR-1.2/FR-1.3）

| 编号 | 用例 | 输入/手法 | 预期结果 | 优先级 |
|---|---|---|---|---|
| UT-DATA-01 | 题材包完整性 | 读取 `D.GENRES`、`D.PACKS` | 5 个类型 `suspense/romance/adventure/apocalypse/scifi`；每个包含 `title/cover/object/clueItem/tokenItem/answerItem/characters(≥3)`，无 `undefined` | P0 |
| UT-DATA-02 | 长度选项契约 | 读取 `D.LENGTH_OPTIONS` | 恰 3 项且 key 为 `short/medium/long`；每项 `time`、`nodes` 非空；`medium` 为默认查找项 | P1 |
| UT-DATA-03 | `buildPackGame` 默认结构 | `buildPackGame("scifi")` | `endingCount===3`；`nodeOrder.length===10`；`startNodeId==="n0"`；`published===true`；`tags[1]==="多结局"`；`stats.length===3` | P0 |
| UT-DATA-04 | 单结局裁剪 | `buildPackGame("romance",{endingCount:1})` | `nodeOrder.length===8`；结局节点仅 `e1`；`nodes.e2===undefined`；`tags[1]==="单结局"` | P0 |
| UT-DATA-05 | 关闭属性系统 | `buildPackGame("adventure",{statsEnabled:false})` | `statsEnabled===false`；`stats` 仍为 3 条定义（仅展示层隐藏）；隐藏选项 `requires===null` | P1 |
| UT-DATA-06 | 未知题材包报错 | `buildPackGame("nope")` | 抛 `Error`，消息含 `Unknown story pack`；不返回半成品对象 | P1 |
| UT-DATA-07 | `createCustomGame` 标记 | `D.createCustomGame({genre:"suspense",background:"..."})` | `isGenerated===true`；`tags[2]==="原创"`；未传 id 时以 `demo-` 前缀生成；`generation.createdAt` 为 ISO 字符串 | P1 |

### 2.2 `story-generator.js` —— 本地剧情引擎（FR-1.1~FR-1.3、FR-2.3）

被测入口：`D.createCustomGame(config)`、`D.previewCustomTitle(bg,title,genre)`、`D.previewCustomCover(bg,genre)`。所有主题/地点值从 `game.generation.analyzed` 与节点结构反查。

| 编号 | 用例 | 输入/手法 | 预期结果 | 优先级 |
|---|---|---|---|---|
| UT-GEN-01 | "游戏"关键词优先 | `BG_GAME` | `analyzed.theme==="game"`（即使文本含"未来"也不得判为 `time`） | P0 |
| UT-GEN-02 | 时间循环主题 | `BG_TIME` | `theme==="time"`；`n0.text` 含"第 1 天" | P0 |
| UT-GEN-03 | 主题优先级：失踪 > 校园 | `校园里有人失踪，教室空了` | `theme==="missing"`（`missing` 规则先于 `campus`） | P1 |
| UT-GEN-04 | 恋爱主题 | `唱片店里有一封没有寄出的情书` | `theme==="romance"` | P1 |
| UT-GEN-05 | 科幻主题 | `月球背面的空间站发来信号` | `theme==="scifi"` | P1 |
| UT-GEN-06 | 末世主题 | `末日后的废土，广播塔还亮着` | `theme==="apocalypse"` | P1 |
| UT-GEN-07 | 冒险主题 | `我继承了一张海图，要去远航` | `theme==="adventure"` | P1 |
| UT-GEN-08 | 校园主题 | `毕业前夜，我回到校园的教室` | `theme==="campus"` | P1 |
| UT-GEN-09 | 灵异主题 | `旧宅里有鬼，镜子会动` | `theme==="supernatural"` | P1 |
| UT-GEN-10 | 无关键词时按类型兜底 | `我收到一封信，信里只有一句话。` + `genre:"scifi"` | `theme==="scifi"`（`detectTheme` 末尾按 genre 兜底） | P1 |
| UT-GEN-11 | 非法类型降级 | `genre:"horror"` + 无关键词文本 | `game.genre==="suspense"`；`theme==="mystery"`；不抛异常 | P1 |
| UT-GEN-12 | 标题派生：来自…的信 | `BG_TIME`，不传 title | `game.title==="来自十年后的信"` | P0 |
| UT-GEN-13 | 显式标题优先并 trim | `title:"  我的故事  "` | `game.title==="我的故事"` | P0 |
| UT-GEN-14 | 短背景预览 | `previewCustomTitle(BG_SHORT,"","romance")` | 返回 `D.PACKS.romance.title`（不进入派生）；显式标题仍优先 | P1 |
| UT-GEN-15 | 地点直接抽取 | `我在旧图书馆里醒来，手里攥着一封信。` | `analyzed.place==="旧图书馆"`（长词优先、包含关系去重） | P0 |
| UT-GEN-16 | 地点按主题兜底 | 无地点词文本 + `genre:"suspense"` | `analyzed.place==="旧城区 · 档案馆街"` | P1 |
| UT-GEN-17 | 地标与地下空间 | `BG_PLAIN` | `analyzed.landmark==="灯塔"`；`nodes.n5.location==="潮线下的旧船坞"` | P1 |
| UT-GEN-18 | 物件与指代 | `BG_PLAIN` | `analyzed.object==="旧钥匙"`；选项文本含"那把钥匙"；`initialInventory` 含"旧钥匙" | P0 |
| UT-GEN-19 | 物件按主题兜底 | `BG_CAMPUS`（无物件词） | `analyzed.object==="被折过的纸条"`；`initialInventory` 含该物件 | P1 |
| UT-GEN-20 | 第二人称转换 | `BG_TIME` 的 `n0.text[0]` | 含"你"，不含"我在旧图书馆"；`我→你`、`我的→你的`、`我们→你们` | P0 |
| UT-GEN-21 | 图完整性 | 任意 `createCustomGame` 结果 | 每个 `nodeOrder` 节点存在；每个 `choice.to` 指向存在的节点；`choice.id` 全局唯一；非结局节点 `choices.length>=1`，结局节点 `choices.length===0` | P0 |
| UT-GEN-22 | 结局全可达 | 从 `n0` 沿 `choices.to` DFS（忽略 `requires`） | 单结局可到 `e1`；多结局可同时到 `e1/e2/e3`；无环死路 | P0 |
| UT-GEN-23 | 单结局结构 | `BG_TIME,{endingCount:1}` | `nodeOrder.length===8`；`n7.choices.length===1`（仅 `c7-2`）；`n4/n5` 各 1 个选项 | P0 |
| UT-GEN-24 | 多结局与隐藏门 | `BG_TIME,{endingCount:3}` | 长度 10；`n7.choices.length===3`；`c7-3.requires==={stat:"insight",min:3,...}`；`e2/e3.isEnding===true` | P0 |
| UT-GEN-25 | 关闭属性系统解锁隐藏门 | 同上 + `statsEnabled:false` | `c7-3.requires===null`（选项仍存在）；`game.statsEnabled===false` | P1 |
| UT-GEN-26 | 确定性（Metamorphic） | 固定 `id`、冻结时钟，连续调用两次 | `JSON.stringify(game.nodes)` 与 `nodeOrder` 完全一致；仅 `generation.createdAt` 可变 | P0 |
| UT-GEN-27 | 长度参数未生效（已知缺陷） | `length:"short"` 与 `length:"long"` 各生成一次 | 当前 `nodeOrder.length` 都是 10，仅 `estimatedTime` 不同 → `xfail(strict)`；修复后 short/long 节点数应不同 | P0 `xfail` |
| UT-GEN-28 | 警告语裁剪 | `BG_LONG`（`别`+100 字） | `n0.text[2]` 含"脑海里又响起那句话"；被引号包裹的警告 ≤ 57 字符且以 `…` 结尾 | P2 |
| UT-GEN-29 | 角色/物品/词库完备 | `BG_TIME` | `characters.length===3`（NPC/盟友/失踪者）；`itemLibrary` 含物件、线索、信物、答案、"潮湿的火柴"；`stats.length===3` | P1 |

```js
// tests/unit/generator.unit.test.js 片段
import { expect, test } from "vitest";
import { loadCore } from "../helpers/core.js";

const { D } = loadCore();               // 在 useFakeTimers 之后加载
const BG_TIME = "2026 年，我在旧图书馆收到一封来自十年后的信。信里写着：别相信管理员。";

test("theme: 游戏关键词优先于时间", () => {
  const game = D.createCustomGame({ id: "g", background: "我在旧图书馆登录了一个游戏，收到一封来自未来的信。", genre: "romance" });
  expect(game.generation.analyzed.theme).toBe("game");
});

test("graph: 所有分支目标存在且结局可达", () => {
  const game = D.createCustomGame({ id: "g", background: BG_TIME, genre: "suspense", endingCount: 3 });
  for (const id of game.nodeOrder) {
    for (const choice of game.nodes[id].choices) expect(game.nodes[choice.to]).toBeTruthy();
  }
  const seen = new Set();
  const stack = ["n0"];
  while (stack.length) {
    const node = game.nodes[stack.pop()];
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    node.choices.forEach((c) => stack.push(c.to));
  }
  expect([...seen].filter((id) => game.nodes[id].isEnding).sort()).toEqual(["e1", "e2", "e3"]);
});
```

### 2.3 `agent-client.js` —— Agent 客户端与编译（FR-1.3、FR-2.3）

被测入口：`EchoQuestAgent.compile(bible, nodes, config, trace, meta)` 与 `EchoQuestAgent.generate(config, handlers)`。`validateNodes` 未导出，通过 `generate` 的 repair 触发间接断言。

| 编号 | 用例 | 输入/手法 | 预期结果 | 优先级 |
|---|---|---|---|---|
| UT-AGT-01 | 最小圣经编译 | `compile(BIBLE, RAW_OK, CONFIG, [], {})` | `nodeOrder===["a","b"]`；`startNodeId==="a"`；`nodes.a.choices[0]` 的 `id/text/to` 为 `a-c1/走向灯塔/b`；`nodes.b.isEnding===true` | P0 |
| UT-AGT-02 | 非法起始节点回退 | `BIBLE.startNodeId="zzz"` | `startNodeId==="a"`（取 plan 首节点），不抛异常 | P1 |
| UT-AGT-03 | 空流程拒绝编译 | `bible.nodes=[]` | 抛 `Error`，消息含"故事流程为空" | P0 |
| UT-AGT-04 | 断链选项被过滤 | plan 选项 `to:"zzz"` | `nodes.a.choices===[]`；不生成指向不存在节点的选项 | P0 |
| UT-AGT-05 | 结局节点字段 | `RAW_OK.b` | `chapter==="结局 · 终点"`；`endingType==="good"`；`endingTitle==="终点"`；`endingQuote==="结束语"`；`choices===[]` | P0 |
| UT-AGT-06 | 正文长度上限 | `a.text=["x".repeat(481)]` | 输出段落长度 481（480 字符 + `…`），不超限 | P1 |
| UT-AGT-07 | 回声条数上限 | `a.echo` 给 5 条 | `nodes.a.echo.length<=3`，且每条 ≤ 181（180+`…`） | P2 |
| UT-AGT-08 | 初始物品上限 | `items` 给 5 件，其中 1 件 `initial:false` | `initialInventory.length<=4`；未声明物品由选项获得时补进 `itemLibrary` | P1 |
| UT-AGT-09 | 角色补足 | `characters` 仅 1 人 | 输出 2 人：原名 + "同行者"；`initial` 取首字，非中文/字母为 `?` | P1 |
| UT-AGT-10 | 封面提示映射 | `coverHint:"sea"` | `game.cover==="harbor"`；未知 hint 回退 `previewCustomCover` 或题材包封面 | P2 |
| UT-AGT-11 | 结局数取 plan 而非配置（已知缺陷） | `CONFIG.endingCount=3`，`BIBLE` 仅 1 个 ending | 实际 `endingCount===1`、`tags[1]==="单结局"` → `xfail(strict)`；期望以配置为准或显式告警 | P1 `xfail` |
| UT-AGT-12 | 健康探测 30s 缓存 | 冻结时钟；连续 `health()` 两次 | 29s 内 `fetch` 仅 1 次；第 31s 再调用变 2 次 | P1 |
| UT-AGT-13 | 健康探测失败语义 | 返回 `HTTP 503` | `{available:false,error:"HTTP 503"}`；不抛异常 | P0 |
| UT-AGT-14 | 响应非 JSON | `response.json()` 抛 `SyntaxError` | 拒绝并抛"Agent 接口返回了无法解析的响应" | P1 |
| UT-AGT-15 | 业务错误信封（字符串） | `{ok:false,error:"已达限流"}` 且 HTTP 200 | 抛 `Error("已达限流")`；不得把对象直接塞进 `Error` | P1 |
| UT-AGT-16 | 健康不可用时不发业务请求 | `health` 返回 `available:false` | `generate` 抛"AI Agent 未启用或服务不可用"；业务路由调用次数为 0 | P0 |
| UT-AGT-17 | 正常链路事件与用量 | 健康可用 + 3 个接口成功 | stage 顺序 `prepare→architect→write→validate→(repair skipped)→compile`；trace id 顺序一致；`usage.total_tokens` 为三段之和；末尾事件 `type==="game"` | P0 |
| UT-AGT-18 | 结构问题触发修复 | writer 返回缺选项节点 | `validate` 阶段 `warning`；`POST /api/agent/repair` 恰 1 次；请求体 `issues.length>=1`；修复后 `issues` 清空则 trace `success` | P0 |
| UT-AGT-19 | 无问题跳过修复 | `RAW_OK` | repair 阶段 `skipped`；repair 路由调用次数为 0；仍产出 `game` | P0 |
| UT-AGT-20 | 取消向上传播 | `AbortController.abort()`，fetch 抛 `AbortError` | `generate` 以 `AbortError` 拒绝；不产生 `game` 事件；不吞异常 | P1 |

```js
// tests/unit/agent.unit.test.js 片段
import { expect, test, vi } from "vitest";
import { loadCore, stubFetch } from "../helpers/core.js";
import { BIBLE, CONFIG, RAW_OK } from "../fixtures/agent.js";

const ok = (body) => ({ body });

test("repair 仅在结构问题时调用一次", async () => {
  const calls = [];
  const fetch = stubFetch({
    "GET /api/health": ok({ ai: true, model: "stub", provider: "stub" }),
    "POST /api/agent/architect": ok({ ok: true, data: BIBLE, meta: {} }),
    "POST /api/agent/write": ok({ ok: true, data: { nodes: { a: { text: ["x"] } } }, meta: {} }),
    "POST /api/agent/repair": ok({ ok: true, data: { nodes: RAW_OK }, meta: {}, issues: [] })
  }, calls);
  const { Agent } = loadCore({ fetch });
  const result = await Agent.generate(CONFIG, {});
  expect(calls.filter((c) => c.key === "POST /api/agent/repair")).toHaveLength(1);
  expect(result.game.nodes.a.choices).toHaveLength(1);
});
```

### 2.4 `app.js` 纯函数（需 `?test=1` 测试钩子，见 D-01）

| 编号 | 用例 | 输入 | 预期结果 | 优先级 |
|---|---|---|---|---|
| UT-APP-01 | HTML 转义全集 | `escapeHtml('&<>"\'')` | `&amp;&lt;&gt;&quot;&#39;`；`escapeHtml(null)===""` | P0 |
| UT-APP-02 | 轻量 Markdown | `narrative("**重点**\n下一行")` | `<strong>重点</strong><br>下一行`；标签已先转义 | P0 |
| UT-APP-03 | 截断与去 Markdown | `truncate("**你好**，世界",3)` | `"你好…"`（先剥 `**`，再切 3 字并去掉尾部标点） | P1 |
| UT-APP-04 | 数值夹紧 | `clamp(120,0,100)`、`clamp(-5,0,5)` | `100`、`0` | P1 |
| UT-APP-05 | 路由解析 | `hash="#/play/story-1?new=1&node=n2"` | `name==="play"`；`param==="story-1"`；`query.new==="1"`、`query.node==="n2"` | P0 |
| UT-APP-06 | 空路由默认发现页 | `hash=""` | `name==="discover"`；`segments===[]` | P1 |
| UT-APP-07 | 时钟推进（同日） | `advanceClock("第 1 天 · 深夜")` | `"第 1 天 · 午夜"` | P1 |
| UT-APP-08 | 时钟推进（跨日） | `advanceClock("第 1 天 · 午夜")` | `"第 2 天 · 凌晨"` | P1 |
| UT-APP-09 | 时钟无法解析 | `advanceClock("时间不明")` | `"时间不明 · 稍后"` | P2 |
| UT-APP-10 | 属性增减与夹紧 | `applyChoiceEffects({effects:{hp:30,insight:2,bond:-9}},run)`，初值 `{hp:90,insight:4,bond:0}` | `{hp:100,insight:5,bond:0}`（hp 0–100，insight/bond 0–5） | P0 |
| UT-APP-11 | 物品去重 | 背包 `["钥匙"]`，效果 `items:["钥匙","信"]` | `["钥匙","信"]`（不重复 push） | P1 |
| UT-APP-12 | 选项解锁判定 | `requires:{stat:"insight",min:3}`，`insight=2`；再令 `statsEnabled=false` | 依次为 `true`、`false`；无 `requires` 恒 `false` | P0 |

> UT-APP-10 是本项目的关键反转用例：若把 hp 下限写成 1 或漏掉上限，玩家会在长线剧情里出现"体力 0 仍可行动"或"体力 130"的状态漂移。

---

## 3. 集成测试用例

> 目录：`tests/integration/`；Playwright 驱动真实页面，`localStorage` 为真实实现，`/api/**` 全部打桩。
> 判定原则：**界面可见结果 + 持久化副作用 + 网络调用次数**三者同时断言。

### 3.1 本地持久化（FR-3.1/FR-3.2）

| 编号 | 用例 | 前置/操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| IT-STO-01 | 草稿自动保存与恢复 | 创作页输入背景/标题/基调 → 刷新 | 三个字段原样回填；`echoquest.draft.v1` 可 `JSON.parse` 且字段一致 | P0 |
| IT-STO-02 | `userGames` 损坏降级 | 预置 `echoquest.userGames.v1="{not-json"` → 打开发现页 | 页面正常渲染示例作品；不白屏；`console.warn` 含 `Could not read local data`；后续操作可覆盖写回 | P0 |
| IT-STO-03 | `overrides` 损坏降级 | 预置非法 overrides → 打开示例作品 | 使用原始示例内容；不抛未捕获异常 | P1 |
| IT-STO-04 | 用户作品持久化 | 完成一次生成 → 刷新 → 进"我的作品" | 新作品卡片存在；`userGames` 长度为 1；详情节点数一致 | P0 |
| IT-STO-05 | 示例作品编辑写 overrides | 编辑示例节点标题并保存 → 刷新 | 标题保留；`overrides` 中该 gameId 有记录；`userGames` 长度仍为 0 | P0 |
| IT-STO-06 | 手动存档按作品隔离 | 在 A 作品存 1 号槽 → 打开 B 作品存档面板 | B 的 5 个槽全空；A 的槽数据未被改写 | P0 |
| IT-STO-07 | 自动存档按作品隔离 | A 推进 2 步 → B 推进 1 步 → 重进 A | A 恢复到自己的节点/属性；B 不串档 | P0 |
| IT-STO-08 | 删除作品级联清理 | 删除 A 并确认 | `userGames` 无 A；`saves[A]`、`autosave[A]` 被删除；路由回到作品库 | P1 |
| IT-STO-09 | 写入失败必须提示（已知缺陷） | 覆写 `Storage.prototype.setItem` 抛 `QuotaExceededError` 后存档 | 当前仅 `console.warn`，界面仍提示"已写入存档位" → `xfail(strict)`；期望出现红色失败提示且不显示成功 toast | P1 `xfail` |

### 3.2 生成链路（FR-1.3/FR-1.4/FR-1.7）

| 编号 | 用例 | 前置/操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| IT-GEN-01 | 本地生成全链路 | `/api/health` 返回 `ai:false`；填 `BG_TIME` 提交；假时钟推进 4.4s | 进度到 100%；跳转 `#/studio/<id>`；`userGames+1`；作品含 10 个节点；toast"故事初稿已完成" | P0 |
| IT-GEN-02 | 生成中取消 | 生成动画进行中点"取消" | 遮罩消失、`body.is-generating` 移除；`userGames` 不增加；草稿保留 | P0 |
| IT-GEN-03 | Agent 正常链路 | health 可用 + 三接口成功 | 进度面板出现 `architect/write/validate/compile` 轨迹；作品 `generation.aiAgent===true`；`agentTrace` 长度 5 | P0 |
| IT-GEN-04 | Agent 失败降级 | `architect` 返回 500 | 自动切本地引擎并完成；`generation.fallback===true`、`agentError` 非空；toast"已用本地引擎完成故事"；不丢草稿 | P0 |
| IT-GEN-05 | 修复链路 | `write` 返回缺选项，`repair` 返回完整 | repair 只调用 1 次；最终作品节点选项数与 plan 一致；轨迹含 repair 成功项 | P0 |
| IT-GEN-06 | 探测失败直接本地 | `/api/health` 网络失败 | 不请求 `architect`；直接本地生成成功；不出现 500 页面 | P0 |
| IT-GEN-07 | 背景不足 10 字 | 输入 `BG_SHORT` 提交 | 行内 `#backgroundError` 可见、输入框标红并聚焦；不进入生成；无网络请求 | P0 |
| IT-GEN-08 | 背景超 2000 字 | JS 直接赋值 2001 字后提交（绕过 `maxlength`） | 被拦截并 toast"最多 2000 字"；不进入生成；不写入 `userGames` | P1 |
| IT-GEN-09 | 整局重新生成保留发布态 | 作品发布后触发"重新生成整局"并确认 | `published` 仍为 `true`；节点内容被替换；`gameId` 不变；手动存档仍可读 | P1 |
| IT-GEN-10 | 重复提交幂等 | 生成按钮连点两次 | 只产生 1 个作品；第二次点击被 `state.generation` 拦截 | P1 |

### 3.3 游玩与自由行动（FR-2.1~FR-2.6）

| 编号 | 用例 | 前置/操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| IT-PLAY-01 | 开局初始状态 | 打开示例作品 `?new=1` | 位于 `startNodeId`；体力 100、线索 0、信任 0；背包含初始物件；历史 1 条 | P0 |
| IT-PLAY-02 | 自动存档恢复 | 连续做 2 个选择 → 刷新同一 URL | 停留在最后节点；属性/背包/历史与刷新前一致 | P0 |
| IT-PLAY-03 | 新开局覆盖 | 已推进后访问 `?new=1` | 回到开场节点；旧自动存档在首次选择后被新状态覆盖 | P1 |
| IT-PLAY-04 | 选择推进副作用 | 点击一个有效选项 | 节点切换；属性按 `effects` 变化并夹紧；历史 +1；`autosave` 的 `nodeId` 更新；进度条前进 | P0 |
| IT-PLAY-05 | 锁定选项不可进入 | 预置自动存档：`nodeId=n7`、`insight=0` | 点击隐藏结局选项显示锁定 toast；节点与历史不变；无 autosave 写入 | P0 |
| IT-PLAY-06 | 体力边界 | 预置 `hp=5` 的历史节点，选择 `hp:-10` | 结果 `hp===0`；页面不出现负数；继续可行动（原型无死亡判定） | P1 |
| IT-PLAY-07 | 背包去重 | 两次获得同一信物 | 背包中该物品仅 1 条；物品库仍可展示描述 | P1 |
| IT-PLAY-08 | 结局与禁继续 | 走到任一 ending | 展示结局标题/引语；`endings` 记录该 id；输入框与选项隐藏；提供"再来一次"入口 | P0 |
| IT-PLAY-09 | 自由行动命中关键词 | 在 `n0` 输入"去灯塔" | 触发 `c0-1` 同款跳转；toast"AI 读懂了你的行动"；属性变化一致 | P0 |
| IT-PLAY-10 | 自由行动未命中 | 输入"坐下来发呆" | 生成 1 条 `freeEchoes` 并显示；时间推进一个时段；自动存档更新；节点不变 | P0 |
| IT-PLAY-11 | 命令与长度校验 | 依次输入 `save`、`help`、空串、101 字 | `save` 打开存档弹窗；`help` 出提示；空串提示"先写下你想做的事"；101 字被拦截且不发请求 | P1 |
| IT-PLAY-12 | 预览模式零写入 | 打开 `?preview=1` 并推进 1 步 | 显示"预览模式"徽标；`autosave`、`saves`、`endings` 均无该作品写入；存档按钮隐藏 | P0 |

### 3.4 存档与回溯（FR-3.2/FR-2.6）

| 编号 | 用例 | 前置/操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| IT-SAVE-01 | 保存并在刷新后读取 | 槽 1 保存 → 刷新 → 打开存档 → 读取 | 节点/属性/背包与保存时一致；`saves[gameId][0].name` 正确 | P0 |
| IT-SAVE-02 | 恰好 5 个槽位 | 打开存档面板 | 渲染 5 个槽（编号 01–05）；不存在第 6 个入口；DOM 中 `data-slot` 最大为 4 | P1 |
| IT-SAVE-03 | 覆盖已有槽 | 槽 1 已有存档 → 改名覆盖 | 仍为 1 条记录；`name` 与 `savedAt` 更新；不新增槽 | P1 |
| IT-SAVE-04 | 读取恢复完整状态 | 先后吃两个不同属性的选项，保存；再选另一条路；读取 | 属性、背包、`freeEchoes`、历史长度都回到保存点 | P0 |
| IT-SAVE-05 | 删除槽位 | 删除槽 2 | 槽 2 变空；其余槽不变；刷新后仍为空 | P1 |
| IT-SAVE-06 | 损坏存档拒绝加载 | 预置槽 1 的 `run.nodeId="ghost"` | 提示"这个存档已经损坏"；当前 run 不被替换；无导航 | P0 |
| IT-SAVE-07 | 存档命名 | 默认名 `存档 · <节点标题>`；改为 24 字上限 | 默认名正确；自定义名持久化；超长被 `maxlength` 限制 | P2 |
| IT-SAVE-08 | 回溯保留旧路径 | 走 A→B→C 后回到 B | 历史截断到 B；`branchArchive` 新增 1 段且含 C；状态回滚到 B 的历史快照；自动存档更新 | P0 |
| IT-SAVE-09 | 存档无版本迁移（已知缺陷） | 预置旧结构槽（缺 `freeEchoes`/`stats.bond`）后读取 | 当前直接 `state.run = slot.run`，页面可能显示 `undefined` → `xfail(strict)`；期望做 schema 版本号与字段补全 | P2 `xfail` |

### 3.5 导出、发布与轨迹（FR-3.4、FR-4 相关展示）

| 编号 | 用例 | 前置/操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| IT-OPS-01 | Markdown 导出内容 | 走 2 个节点 + 1 次自由行动后导出 | 文件含 `# 标题`、`## 01 · 节点名`、`**你的选择：**`、`## AI 续写记录`、结尾署名；段落无 `**` 残留 | P0 |
| IT-OPS-02 | 导出文件名安全 | 标题含 `/ : * ? " < >` 等非法字符后导出 | 文件名中非法字符被替换为 `-`；扩展名 `.md` 保留 | P1 |
| IT-OPS-03 | 发布到广场 | 发布作品 → 回发现页 → 刷新 | 卡片出现且标记已发布；`userGames` 中 `published===true` 持久化 | P0 |
| IT-OPS-04 | 分享链接 | 打开分享弹窗 → 复制 | 链接为 `#/play/<encoded id>`；剪贴板不可用时回退 `execCommand` 并提示 | P2 |
| IT-OPS-05 | 删除二次确认 | 点删除 → 取消；再删除 → 确认 | 取消时作品仍在；确认后删除并清理关联存档 | P1 |
| IT-OPS-06 | Agent 轨迹面板 | 打开 Agent 生成作品的"故事是如何生成的" | 显示模式/模型/token/耗时；降级作品显示 fallback 提示与错误原因；无轨迹时显示空态 | P2 |

### 3.6 安全与健壮性（NFR-SEC）

| 编号 | 用例 | 前置/操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| IT-SEC-01 | 背景 XSS | `BG_XSS` 生成后进入游玩页 | 不执行脚本（`window.__xss` 未定义）；页面以文本显示 `<img ...>`；无 `img[onerror]` 节点 | P0 |
| IT-SEC-02 | 标题/存档名 XSS | 标题、存档名填 `<script>alert(1)</script>` | 仅作为文本渲染；无脚本执行；DOM 中无注入的 `script` 元素 | P0 |
| IT-SEC-03 | 自由行动回显转义 | 输入 `<img src=x onerror=...>` | 回显为文本；不创建元素；仍可正常继续 | P0 |
| IT-SEC-04 | 恶意 localStorage 注入 | 注入 nodes 文本含 `<svg onload=...>` 的作品 JSON | 渲染转义；不执行；不因非法结构崩溃 | P1 |
| IT-SEC-05 | 无密钥/无动态执行 | 静态扫描 `code/frontend/**` | 不含 `sk-`、`api_key`、`Bearer `；不含 `eval(`、`new Function(`；`innerHTML` 拼接处均经 `escapeHtml/narrative` | P1 |

---

## 4. 端到端（E2E）冒烟用例

> 工具：Playwright + 本地静态服务器；后端默认不可用（走本地引擎）。每例独立 `localStorage`。

| 编号 | 场景 | 步骤 | 预期结果 | 优先级 |
|---|---|---|---|---|
| E2E-01 | 示例作品通关 | 发现页 → 打开《雾港来信》 → 连选至结局 | 每步节点/属性更新；结局页出现；结局被记录；可"再来一次" | P0 |
| E2E-02 | 创作全链路 | 创作页填背景/类型/结局数 → 生成 → 进入创作台 | 进度到 100%；作品落库；故事树节点数与 `nodeOrder` 一致 | P0 |
| E2E-03 | 编辑与预览 | 创作台改节点标题/正文 → 保存 → 预览本段 | 预览页显示修改后文本；返回后改动仍在；刷新不丢 | P0 |
| E2E-04 | 存档闭环 | 游玩 2 步 → 存槽 1 → 刷新 → 读档 | 回到保存点；状态一致；toast 提示读取成功 | P0 |
| E2E-05 | 结局收集 | 通关两个不同结局 → 打开作品库 | 结局计数增加；已收集列表无重复；未解锁结局显示为锁定 | P1 |
| E2E-06 | 自由行动 | 在开场输入"检查信封" | 命中关键词并推进，或生成一段续写；两种结果都不得卡死 | P0 |
| E2E-07 | 移动端布局 | 375×812 视口跑 E2E-01 主路径 | 无横向滚动；选项按钮可点；输入框不被键盘遮挡（视觉截图基线） | P1 |
| E2E-08 | 键盘与无障碍 | 仅用 Tab/Enter 完成"创作→生成→选择" | 焦点可见；按钮可达；toast 处于 `aria-live="polite"` 区域；无焦点陷阱 | P1 |
| E2E-09 | 后端离线降级 | 拦截 `/api/**` 全部失败 | 首屏可用；生成自动走本地；页面出现降级说明而非报错页 | P0 |
| E2E-10 | `file://` 直接打开 | 直接打开 `code/frontend/index.html` | 健康探测跳过（不报 CORS）；发现页/示例游玩可用；控制台无未捕获异常 | P2 |

---

## 5. 后端接口契约测试（当前 `skip`）

> 后端未实现。以下用例先按 `architecture.md` 固化契约，服务端落地后去掉 `skip`，用于前后端联调回归。
> 标记：`describe.skip`（不是 `xfail`）—— 它们描述的是**尚未存在的被测对象**，不是已知缺陷。

| 编号 | 用例 | 请求/断言 | 预期结果 | 优先级 |
|---|---|---|---|---|
| CT-01 | 健康接口 | `GET /api/health` | 200；JSON 至少含 `ai:boolean`；可用时含 `model/provider`；前端据此决定 Agent/本地模式 | P0 |
| CT-02 | 架构请求体 | `POST /api/agent/architect` | 含 `background(10–2000)`、`genreLabel`、`tone`、`length(short/medium/long)`、`endingCount` 取 1 或 3、`statsEnabled`；字段名与 `agent-client.js` 完全一致 | P0 |
| CT-03 | 架构响应体 | 同上 | `{ok:true,data:{title,startNodeId,nodes[]},meta:{latencyMs,usage,model}}`；`nodes[].id` 匹配 `^[a-zA-Z0-9_-]{1,24}$` | P0 |
| CT-04 | 撰写请求体 | `POST /api/agent/write` | 原样回传 `bible`；含 `background/endingCount/statsEnabled`；不得丢字段 | P0 |
| CT-05 | 撰写响应体 | 同上 | `data.nodes` 为以节点 id 为键的对象；每节点 `text:string[]`；非结局节点选项数与 plan 一致 | P0 |
| CT-06 | 修复请求体 | `POST /api/agent/repair` | `issues` 为非空字符串数组（≤20 条）；原样回传 `bible/nodes` | P1 |
| CT-07 | 错误信封兼容（已知缺陷） | 返回 `{ok:false,error:{code,message,...}}` | 前端 `new Error(data.error)` 会把对象变成 `[object Object]` → `xfail(strict)`；期望读取 `error.message` 并保留 `code` | P0 `xfail` |
| CT-08 | 限流/超时降级 | 返回 429 或 502 | 前端捕获后切本地引擎，作品仍可生成；不出现未捕获 Promise | P1 |

---

## 6. SQLite 数据模型测试

> 目的：结构正确、约束有效、重建可重复。前端当前不读写数据库，因此这组用例是**后端落地前的护栏**，不是端到端数据同步测试。
> 手法：`tmp_path` 复制 `schema.sql` 建临时库；每个用例独立连接。

| 编号 | 用例 | 操作 | 预期结果 | 优先级 |
|---|---|---|---|---|
| DB-01 | 结构与完整性 | 执行 `schema.sql` | `sqlite_master` 中表 31 张、视图 4 个；`PRAGMA integrity_check` 返回 `ok` | P0 |
| DB-02 | 外键按连接开启 | 建库后关闭再重开连接，读取 `PRAGMA foreign_keys` | 新连接为 `0`（SQLite 默认）；显式 `PRAGMA foreign_keys=ON` 后为 `1` —— 后端每条连接都必须设置 | P0 |
| DB-03 | 邮箱大小写唯一 | 插入 `A@x.com` 与 `a@x.com` | 第二次抛 `IntegrityError`（`ux_users_email` 为 `COLLATE NOCASE`） | P0 |
| DB-04 | 枚举约束 | `users.role='root'`、`games.genre='horror'`、`games.status='live'` | 均抛 `IntegrityError`（CHECK 生效），不静默写入 | P1 |
| DB-05 | 剧情节点约束 | ① `node_type='ending'` 且 `ending_type=NULL`；② `scope='run'` 且 `run_id=NULL`；③ `scope='canonical'` 且 `run_id` 非空 | 三种情况均被 CHECK 拒绝 | P0 |
| DB-06 | 选项顺序唯一 | 同一 `node_id` 插入两条 `order_index=0` | 抛 `IntegrityError`（`UNIQUE(node_id, order_index)`）；`to_node_id` 允许 NULL | P1 |
| DB-07 | 存档槽位约束 | `slot_no=0`、`slot_no=6`、同一 `run_id` 重复槽位 | 前两者被 CHECK 拒绝；第三者被 `UNIQUE(run_id, slot_no)` 拒绝 | P0 |
| DB-08 | JSON 字段校验 | `choices.stat_delta='not-json'`、`runs.state='[]x'`、`run_saves.snapshot='{'` | 均抛 `IntegrityError`（`json_valid` CHECK） | P1 |
| DB-09 | 级联删除 | 删除 user；删除 game | 该 user 的 games/oauth_accounts 级联删除；game 的 story_nodes/choices/runs 级联删除；`run_steps` 随 run 删除 | P0 |
| DB-10 | 部分唯一索引 | 同一 `(game_id,version,node_key)` 插两条 canonical；同一 `run_id` 插两条同 `node_key` 的 run 节点 | 均抛 `IntegrityError`；不同版本/不同 run 可同名 | P1 |
| DB-11 | 重建脚本与匿名用户前提 | 运行 `init_db.py` 两次；随后直接插入 game | 两次均成功且表数 31；库中业务数据为空；未先插入 guest 用户时 `games.author_id` 外键失败（符合 README 约定） | P1 |
| DB-12 | 视图语义 | 插入 canonical 与 run 两类节点后查 `v_canonical_nodes`；无 run 时查 `v_ending_stats` | 视图只返回 canonical；`finish_rate_pct` 为 `NULL` 而非除零错误 | P2 |

```python
# tests/db/test_schema.py 片段
import sqlite3, pytest
from pathlib import Path

SCHEMA = Path(__file__).parents[2] / "code/backend/database/schema.sql"

@pytest.fixture()
def db(tmp_path):
    con = sqlite3.connect(tmp_path / "t.db")
    con.executescript(SCHEMA.read_text(encoding="utf-8"))
    con.execute("PRAGMA foreign_keys = ON")
    yield con
    con.close()

def test_ending_requires_type(db):
    db.execute("INSERT INTO users (id,email,nickname) VALUES (1,'a@x.com','a')")
    db.execute("INSERT INTO games (id,author_id,title,genre) VALUES (1,1,'t','suspense')")
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("INSERT INTO story_nodes (game_id,version,node_key,node_type,body) VALUES (1,1,'e','ending','x')")

def test_tables_and_views(db):
    tables = db.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0]
    views = db.execute("SELECT count(*) FROM sqlite_master WHERE type='view'").fetchone()[0]
    assert (tables, views) == (31, 4)
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
```

---

## 7. 非功能测试

| 编号 | 维度 | 用例 | 条件/手法 | 通过标准 | 优先级 |
|---|---|---|---|---|---|
| NFT-01 | 可用性 | 完全离线首屏 | 断网打开发现页 | 3s 内出现首个故事卡片；字体回退系统中文字体；无阻塞性错误 | P0 |
| NFT-02 | 性能 | 本地生成节奏 | 假时钟/`page.clock` 推进 | 4.4s ± 200ms 完成；进度单调不减；阶段文案与进度同步 | P1 |
| NFT-03 | 性能 | 取消响应 | 生成中触发取消 | 100ms 内遮罩消失、定时器清理、无后续写入 | P1 |
| NFT-04 | 可测试性 | 测试套件预算 | CI 统计 | 单元全套 < 10s；单例 < 100ms；集成单例 < 15s | P2 |
| NFT-05 | 可用性 | 移动端布局 | 375×812，跑主路径 | 无横向滚动；触控目标 ≥ 40px；文本不溢出容器 | P1 |
| NFT-06 | 可用性 | 无障碍基线 | `@axe-core/playwright` 扫描发现/创作/游玩三页 | 无 critical/serious；对比度、表单标签、按钮名称通过 | P1 |
| NFT-07 | 隐私 | 外部请求最小化 | 记录首屏所有请求 | 除 Google Fonts 外无第三方请求；无 `/api/**` 之外的业务外联；无 Key/token 出现在 URL | P1 |
| NFT-08 | 稳定性 | 长会话 | 连续 50 次自由行动 | `localStorage` 体积 < 1MB；单步渲染 < 200ms；无内存泄漏式 DOM 增长（节点数稳定） | P2 |

---

## 8. 执行、门禁与缺陷登记

### 8.1 CI 门禁

| 阶段 | 触发 | 执行 | 阻塞条件 |
|---|---|---|---|
| PR Check | 每次 push | `vitest run tests/unit` → `playwright test integration` → `pytest tests/db` | 任一非 xfail 的 P0 失败；单元覆盖率 < 70% |
| Nightly | 每日 02:00 | 全量 E2E（Chromium/Firefox/WebKit）+ `axe` + 移动端截图 | P0/P1 失败；无障碍出现 critical |
| Release | 打 tag | E2E-01~09 + 安全用例 + 契约（服务端就绪后） | 任一失败 |

### 8.2 已知缺陷与测试债

| 编号 | 关联用例 | 现象 | 影响 | 修复后动作 |
|---|---|---|---|---|
| D-01 | UT-APP-01~12 | `app.js` 为闭合 IIFE，纯函数不可直接引用 | 单测只能走 E2E，反馈慢 | 增加 `?test=1` 钩子或拆出 `core.js`；钩子保留为测试入口 |
| D-02 | UT-GEN-27 | `length` 参数只影响 `estimatedTime`，节点数恒为 8/10 | 与"约 8/12/18 节点"文案不符 | 按长度裁剪/扩展节点；去掉 `xfail` |
| D-03 | UT-AGT-11 | `compileGame` 的 `endingCount` 取自 plan，忽略 `config.endingCount` | 请求 3 结局但只拿到 1 个时，标签/统计不一致 | 以配置为准并在 `issues` 中告警；去掉 `xfail` |
| D-04 | IT-STO-09 | `writeStore` 失败只 `console.warn`，调用方仍提示成功 | 隐私模式/配额满时用户误以为已保存 | 返回布尔并向上传递，失败 toast；去掉 `xfail` |
| D-05 | IT-SAVE-09 | 存档无 `schemaVersion` 与字段补全 | 版本升级后旧档可能出现 `undefined` | 增加版本号 + 迁移函数；去掉 `xfail` |
| D-06 | CT-07 | 前端 `new Error(data.error)` 不识别对象信封 | 错误提示显示 `[object Object]` | 解析 `error.message/code`；去掉 `xfail` |
| D-07 | CT-01~08 | 后端四接口、账号、审核、限流、数据库读写均未实现 | 只能验证前端降级路径 | 服务端落地后解除 `skip`，补端到端数据一致性用例 |
| D-08 | IT-OPS-03/04 | 发布与分享仅在本机 `localStorage` 生效 | 换设备/换浏览器链接失效 | 属当前原型边界；接入服务端后升级为跨端用例 |

### 8.3 用例统计

| 层级 | 用例数 | P0 | P1 | P2 | 其中 xfail |
|---|---|---|---|---|---|
| 单元测试（§2） | 68 | 30 | 34 | 4 | 2 |
| 集成测试（§3） | 51 | 30 | 17 | 4 | 2 |
| E2E 冒烟（§4） | 10 | 6 | 3 | 1 | 0 |
| 契约测试（§5，skip） | 8 | 6 | 2 | 0 | 1 |
| 数据库测试（§6） | 12 | 6 | 5 | 1 | 0 |
| 非功能（§7） | 8 | 1 | 5 | 2 | 0 |
| **合计** | **157** | **79** | **66** | **12** | **5** |

> 说明：`xfail(strict=True)` 不是"允许失败"，而是把已识别缺陷固化为可被 CI 感知的契约；修复后必须显式去掉标记，否则该用例会转为失败提醒。`skip` 用于尚不存在的后端对象，与缺陷无关。

### 8.4 覆盖率目标

| 模块 | 行覆盖 | 分支覆盖 | 说明 |
|---|---|---|---|
| `story-generator.js` | ≥ 80% | ≥ 75% | 主题/地点/物件派生分支多，用参数化覆盖 |
| `agent-client.js` | ≥ 85% | ≥ 80% | 编译与错误分支是核心 |
| `data.js` | ≥ 70% | — | 大量静态文案不计入有效覆盖 |
| `app.js` | ≥ 50% | — | 以 E2E 行为覆盖为主，纯函数靠钩子 |
| 数据库结构 | — | — | 以约束用例替代覆盖率 |

---

## 附录 A：目录结构

```text
tests/
├── unit/
│   ├── data.unit.test.js
│   ├── generator.unit.test.js
│   ├── agent.unit.test.js
│   └── helpers.unit.test.js
├── integration/
│   ├── storage.it.spec.js
│   ├── generation.it.spec.js
│   ├── play.it.spec.js
│   ├── saves.it.spec.js
│   ├── ops.it.spec.js
│   └── security.it.spec.js
├── e2e/
│   └── smoke.e2e.spec.js
├── contract/
│   └── api.contract.test.js
├── db/
│   └── test_schema.py
├── fixtures/
│   ├── agent.js
│   ├── stories.js
│   └── stores.js
└── helpers/
    ├── core.js
    ├── clock.js
    └── integration.js
```


