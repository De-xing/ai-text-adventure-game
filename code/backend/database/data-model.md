# EchoQuest 数据模型 v0.2

> 对齐文档：`../../../docs/software/architecture.md` v1.3（Dynamic Flow）
> 目标库：**SQLite 3.35+**（实测 3.50.4）｜ 规模：**31 张表 + 4 个视图**
> 配套文件：`schema.sql`（建表）｜`echoquest.db`（空库）｜`data-dictionary.md`（逐字段字典）

---

## 0. 一句话结论

整套模型要同时装下**两种过程**：

| 过程 | 什么时候发生 | 存哪 |
|---|---|---|
| **生成流水线** | 用户提交背景后，跑一次（architect → write → validate → repair → compile） | `pipeline_runs` / `pipeline_stages` / `pipeline_issues` + `story_bibles` |
| **运行时 ReAct** | 玩家每一回合，跑 N 步（思考 → 调工具 → 观察） | `agent_traces` + `run_steps` |

外加三层静态内容：**作品**（创作者的东西）、**剧情**（生成出来的图）、**游玩**（某一局的足迹）。

---

## 1. 七个域

| 域 | 表 | 是什么 |
|---|---|---|
| 身份 | `users` `oauth_accounts` | 账号、第三方登录 |
| 作品 | `games` `background_settings` `generation_params` `characters` `stat_defs` `item_defs` `location_defs` | 创作者的作品设定 |
| 剧情 | `story_nodes` `choices` | 剧情图（节点 + 边） |
| 游玩 | `runs` `run_steps` `run_saves` `agent_traces` `run_summaries` `story_memory` | 一局的足迹、ReAct 轨迹、长期记忆 |
| AI | `generation_tasks` `prompt_templates` `moderation_records` | 单次模型调用、提示词、合规 |
| 流水线 | `pipeline_runs` `pipeline_stages` `pipeline_issues` `story_bibles` `game_versions` `locked_facts` | 一次整局生成的编排与质检 |
| 运营 | `share_links` `reviews` `reports` `audit_logs` `usage_counters` | 分享、评价、举报、审计、限流 |

---

## 2. 生成流水线怎么落表（对应 architecture.md §3）

```text
用户背景
  → pipeline_runs（一条，状态 running）
      ├─ pipeline_stages(architect)  → story_bibles + story_nodes(拓扑)   [LLM]
      ├─ pipeline_stages(write)      → story_nodes(body) + choices        [LLM]
      ├─ pipeline_stages(validate)   → pipeline_issues（可能多条）         [本地]
      ├─ pipeline_stages(repair)     → 修复后的 artifact，parent=失败的 validate [LLM]
      ├─ pipeline_stages(validate#2) → 通过
      └─ pipeline_stages(compile)    → 正式写入 story_nodes/choices/设定表
  → pipeline_runs 置 succeeded，汇总 token 与费用
```

| 阶段 | 对应 API | 落的表 | 能否跳过模型 |
|---|---|---|---|
| architect | `/api/agent/architect` | `story_bibles` + `pipeline_stages.artifact` | 否 |
| write | `/api/agent/write` | `story_nodes` + `choices` | 否 |
| validate | 本地函数 | `pipeline_issues` | 是（纯本地） |
| repair | `/api/agent/repair` | `pipeline_stages`（parent_stage_id 指回 validate） | 否 |
| compile | 本地函数 | `story_nodes` / `choices` / 设定表定稿 | 是（纯本地） |

**为什么中间产物也要落库**：`artifact` 存每阶段原始 JSON，Compiler 挂了只重跑 compile，不用再烧一次 token。超过 32KB 截断写 `artifact`，完整版落对象存储、路径写 `artifact_path`。

---

## 3. 混合输入：选项与自由文本

| 玩家动作 | 数据 |
|---|---|
| 点选项 | `run_steps(action_type='choice')` → 跳到预生成节点（`scope='canonical'`） |
| 自由输入 | `run_steps(action_type='free_text')` → AI 现生成节点（`scope='run'`，仅本局可见） |

两条路都写 `run_steps`，`parent_step_id` 自引用成树；回退只改 `runs.current_step_id`，历史不删。

---

## 4. 关键决策

**D1 作品用 `version` 版本化**
`story_nodes.version` + `games.current_version` + `runs.version`。重新生成整局时老存档仍指向老树，不会报废。`game_versions` 额外存版本元信息（节点数、结局数、改了什么），支持撤销与回滚。

**D2 运行期生成的节点私有**
`story_nodes.scope = 'canonical' | 'run'`。玩家打字生成的支线只属于他自己那局，不会污染作品。

**D3 回退 = 步骤树 + 指针**
`runs.current_step_id` 指回去即可，后续步骤原样留在树里。

**D4 存档 = 指针 + 快照**
`run_saves` 只存 `(node_id, state, step_id)`，历史本来就在 `run_steps` 里。

**D5 审核对象是「作品」和「输出片段」**
作品级看 `games.status`；片段级看 `moderation_records`。

**D6 ReAct 过程单独存**
`agent_traces` 记每步 `thought` / `tool_name` / `tool_args` / `observation`。一次玩家输入 = 一个 `turn`，内含 N 个 `step`。

**D7 流水线的 attempt 上限写进 CHECK**
`pipeline_stages.attempt` 限制 1–3，`CHECK` 兜底。架构要求「每阶段最多 2 次总调用」，数据库层面就不给第 4 次机会。

**D8 并发控制靠部分唯一索引**
同一作品同时只允许一个进行中的生成任务：
```sql
CREATE UNIQUE INDEX ux_pipeline_active ON pipeline_runs (game_id)
    WHERE status IN ('pending', 'running');
```

**D9 记忆表先不带向量**
`story_memory` 存 `text` + `importance` + `embedding_ref`。SQLite 没有向量类型，阶段 2 迁 PostgreSQL 时加一列 `embedding vector(1536)` 即可，表结构不用重做。

---

## 5. 与 architecture.md 的对应

| architecture.md | 本模型 |
|---|---|
| §2.4 结局数 1 或 3 | `generation_params.ending_count CHECK (ending_count IN (1,3))` |
| §2.4 单篇 2–3 次模型调用 | `pipeline_stages` 里 LLM 阶段数即调用数 |
| §1.4 JSON 一次通过率 | `pipeline_issues` + `pipeline_stages.attempt` 聚合 |
| §1.4 结构可玩率 | `pipeline_issues` 里 `NODE_UNREACHABLE` / `CHOICE_TOO_FEW` 计零 |
| §1.4 单篇 token / 成本 | `pipeline_runs.total_tokens` / `total_cost_usd` |
| §3.5 Agent Trace | `pipeline_stages`（生成期）+ `agent_traces`（游玩期） |
| §5.2 Session（Redis） | **不入库**，Redis 只存 2 小时热数据 |
| §5.3 长期记忆 | `story_memory`（无向量版） |
| §5.6 版本快照 | `game_versions` |
| §5.6 同一作品单任务 | `ux_pipeline_active` 唯一索引 |
| §7.2 lockedFacts | `locked_facts` |
| 匿名用户（当前无账号） | 约定插入 `users.id=1` 的 guest 账号 |

---

## 6. 匿名用户约定（重要）

架构 §2.2 明确「当前没有账号系统」，作品存在 localStorage。但库里 `games.author_id`、`runs.user_id` 都是 `NOT NULL`。

**上线第一步先插这条**（`schema.sql` 头部也写了）：

```sql
INSERT INTO users (id, email, nickname, role)
VALUES (1, 'guest@local', '匿名创作者', 'player');
```

未登录产生的作品先挂它名下；接入登录后再把 `author_id` 迁到真实用户。

---

## 7. 怎么用

```powershell
# 方式一：用附带的 echoquest.db（31 张表已建好）
# 方式二：从零重建
py -c "import sqlite3;sqlite3.connect('echoquest.db').executescript(open('schema.sql',encoding='utf-8').read())"
```

- **后端每个连接必须执行 `PRAGMA foreign_keys = ON`**——SQLite 默认关闭外键，不打开则所有外键和级联删除全部失效
- 并发建议：`PRAGMA journal_mode = WAL;` + `PRAGMA busy_timeout = 5000;`
- 图形化看表：DB Browser for SQLite 或 DBeaver

---

## 8. 迁移到 PostgreSQL 的注意点（阶段 2）

架构 §7.4 第 2 阶段要上 pgvector。届时需要：

1. 把 31 张表按方言转换（uuid / jsonb / timestamptz / 部分索引均已有对应写法）
2. `story_memory` 加 `embedding vector(1536)`，建 `ivfflat` 或 `hnsw` 索引
3. 数据迁移：SQLite → `pg_dump` 不通用，用 Python 逐表读写即可（31 表、量级很小）

---

## 9. 下一步

1. **种子数据**：一个 12 节点示例作品 + 一条完整流水线记录，打开就有内容可演示
2. **接口清单**：`/api/agent/*` 七个路由 → 表 → 参数，给后端直接抄
3. **指标 SQL**：JSON 一次通过率、断链率、单篇成本，做成视图
