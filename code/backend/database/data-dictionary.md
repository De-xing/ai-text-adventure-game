# EchoQuest 数据库数据字典

> 数据库：SQLite 3.35+ ｜ 模型版本 v0.2（对齐 architecture.md v1.3）
> 共 **31 张表**、**4 个视图**，合计 **308 个字段**。本文件由 `schema.sql` 自动生成。

## 表清单

| 域 | 表名 | 字段数 | 用途 |
|---|---|---|---|
| 身份域 | `users` | 10 | 账号主体。role 区分普通玩家与管理员，status 控制封禁。 |
| 身份域 | `oauth_accounts` | 5 | 第三方登录绑定关系，一个用户可以绑多个平台。 |
| 作品域 | `games` | 12 | 作品主表。status 是发布状态机，current_version 指向当前生效的剧情版本。 |
| 作品域 | `background_settings` | 7 | 创作者填写的故事背景，与 games 一对一。 |
| 作品域 | `generation_params` | 8 | 一次生成的参数配置，与 games 一对一。 |
| 作品域 | `characters` | 10 | 作品中的角色（主角/NPC），secret 字段只给 AI 看，不对玩家展示。 |
| 作品域 | `stat_defs` | 9 | 作品自定义的数值属性（血量、金钱、好感度等）。 |
| 作品域 | `item_defs` | 8 | 作品自定义的物品元数据。玩家实际持有情况在 runs.state 里。 |
| 作品域 | `location_defs` | 7 | 作品自定义的地点，parent_key 支持层级（如「旅店 → 二楼」）。 |
| 剧情域 | `story_nodes` | 14 | 剧情节点。scope 区分「作品内容」与「玩家私有分支」，version 支持作品改版。 |
| 剧情域 | `choices` | 8 | 节点上的选项（有向边），stat_delta 描述选择带来的数值变化。 |
| 游玩域 | `runs` | 14 | 一次游玩实例（一局）。state 是当前状态的权威快照。 |
| 游玩域 | `run_steps` | 11 | 交互足迹，只追加不修改；parent_step_id 自引用构成树，回退只改指针。 |
| 游玩域 | `run_saves` | 9 | 手动存档，一局最多 5 个槽位。只存指针与快照，不复制历史。 |
| 游玩域 | `agent_traces` | 15 | ReAct 每一步的思考/工具/观察，用于追溯与成本分析，不面向玩家。 |
| 游玩域 | `run_summaries` | 6 | 长局上下文压缩，每 K 回合一条摘要。 |
| 游玩域 | `story_memory` | 10 | 故事记忆：世界观、角色卡、场景、摘要、关键选择。SQLite 版暂不存向量。 |
| AI 域 | `generation_tasks` | 19 | 一次 AI 生成任务：参数、token、费用、状态，是成本核算与限流的依据。 |
| AI 域 | `prompt_templates` | 6 | 提示词模板，按 code + version 管理，可灰度切换。 |
| AI 域 | `moderation_records` | 10 | 输入/输出的合规检查结果。多态关联 steps / tasks / games。 |
| 生成流水线域 | `pipeline_runs` | 15 | 一次「整局生成」的编排实例，串联 architect→write→validate→repair→compile。 |
| 生成流水线域 | `pipeline_stages` | 20 | 单个阶段的执行记录，含 attempt、耗时、token、原始产物 artifact。 |
| 生成流水线域 | `pipeline_issues` | 8 | Validator 报出的问题逐条落库，「JSON 一次通过率」「断链率」都靠它算。 |
| 生成流水线域 | `story_bibles` | 12 | 故事圣经：主题、核心冲突、真相、结局方向、角色动机。②③④⑤ 阶段共用。 |
| 生成流水线域 | `game_versions` | 11 | 作品版本快照，支持撤销与发布回滚（architecture.md 5.6）。 |
| 生成流水线域 | `locked_facts` | 8 | 世界观硬约束，禁止模型改写（architecture.md 7.2 lockedFacts）。 |
| 运营域 | `share_links` | 10 | 分享链接。token 不可枚举，version 钉住分享时的作品版本。 |
| 运营域 | `reviews` | 6 | 玩家对作品的评分与评论，一人一条。 |
| 运营域 | `reports` | 9 | 举报记录，target 为多态引用。 |
| 运营域 | `audit_logs` | 7 | 管理员操作审计流水。 |
| 运营域 | `usage_counters` | 4 | 按天累计的用量计数，用于限流。 |

---

## 一、身份域

*注册、登录、账号体系*

### `users`

账号主体。role 区分普通玩家与管理员，status 控制封禁。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `email` | 文本 | 是 |  |  | 邮箱（大小写不敏感唯一） |
| `password_hash` | 文本 |  |  |  | 第三方登录用户可为空 |
| `nickname` | 文本 | 是 |  |  | 昵称 |
| `avatar_url` | 文本 |  |  |  | 头像地址 |
| `bio` | 文本 |  |  |  | 个人简介 |
| `role` | 文本 | 是 | 'player' | CHECK(role IN ('player', 'admin')) | 角色：player / admin |
| `status` | 文本 | 是 | 'active' | CHECK(status IN ('active', 'banned', 'deleted')) | 状态 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |
| `updated_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 最后更新时间 |

### `oauth_accounts`

第三方登录绑定关系，一个用户可以绑多个平台。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `user_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 所属用户 |
| `provider` | 文本 | 是 |  |  | github / wechat / google |
| `provider_uid` | 文本 | 是 |  |  | 第三方平台的用户唯一标识 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (provider, provider_uid)`

---

## 二、作品域

*创作者的作品设定，生成与游玩都读这些*

### `games`

作品主表。status 是发布状态机，current_version 指向当前生效的剧情版本。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `author_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 创建者 |
| `title` | 文本 | 是 |  |  | 标题 |
| `summary` | 文本 |  |  |  | 压缩后的摘要正文 |
| `cover_url` | 文本 |  |  |  | 封面图地址 |
| `genre` | 文本 | 是 | 'other' | CHECK(genre IN ('suspense', 'romance', 'adventure',                                      'apocalypse', 'scifi', 'other')) | 任何状态 → banned（管理员下架） |
| `status` | 文本 | 是 | 'draft' | CHECK(status IN ('draft', 'generating', 'generation_failed',                                       'private', 'under_review', 'published',                                       'rejected', 'banned')) | 状态 |
| `current_version` | 整数 | 是 | 1 |  | 当前生效的剧情版本号 |
| `play_count` | 整数 | 是 | 0 |  | 游玩次数 |
| `published_at` | 文本 |  |  |  | 发布时间 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |
| `updated_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 最后更新时间 |

### `background_settings`

创作者填写的故事背景，与 games 一对一。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `game_id` | 整数 | 是 |  | PK；→ games.id ·删除时 CASCADE | 所属作品 |
| `worldview` | 文本 |  |  |  | 世界观 |
| `protagonist` | 文本 |  |  |  | 主角 |
| `era` | 文本 |  |  |  | 时代 |
| `tone` | 文本 |  |  |  | 情绪基调 |
| `raw_text` | 文本 | 是 |  |  | 创作者原始输入（10–2000 字，长度在应用层校验） |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `generation_params`

一次生成的参数配置，与 games 一对一。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `game_id` | 整数 | 是 |  | PK；→ games.id ·删除时 CASCADE | 所属作品 |
| `target_length` | 文本 | 是 | 'medium' | CHECK(target_length IN ('short', 'medium', 'long')) | 篇幅：short / medium / long |
| `ending_count` | 整数 | 是 | 1 | CHECK(ending_count IN (1, 3)) | 结局数量 1–5 |
| `stats_enabled` | 整数 | 是 | 0 | CHECK(stats_enabled IN (0, 1)) | 是否启用数值属性系统 |
| `model` | 文本 |  |  |  | 覆盖默认模型，NULL 用全局配置 |
| `temperature` | 小数 |  |  | CHECK(temperature BETWEEN 0 AND 2) | 采样温度 0–2 |
| `extra` | 文本 | 是 | '{}' | CHECK(json_valid(extra)) | 扩展参数（JSON） |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `characters`

作品中的角色（主角/NPC），secret 字段只给 AI 看，不对玩家展示。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `key` | 文本 | 是 |  |  | chr_elder |
| `name` | 文本 | 是 |  |  | 名称 |
| `role` | 文本 | 是 | 'npc' | CHECK(role IN ('protagonist', 'npc')) | 角色：player / admin |
| `description` | 文本 |  |  |  | 描述 |
| `secret` | 文本 |  |  |  | 仅 AI 可读，不展示给玩家 |
| `relationship` | 文本 |  |  | CHECK(relationship IN ('ally', 'enemy', 'stranger', 'neutral')) | 与玩家的初始关系 |
| `avatar_url` | 文本 |  |  |  | 头像地址 |
| `sort_order` | 整数 | 是 | 0 |  | 排序序号 |

**表级约束**

- `UNIQUE (game_id, key)`

### `stat_defs`

作品自定义的数值属性（血量、金钱、好感度等）。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `key` | 文本 | 是 |  |  | hp / money / affinity_elder |
| `name` | 文本 | 是 |  |  | 名称 |
| `initial_value` | 整数 | 是 | 0 |  | 初始值 |
| `min_value` | 整数 | 是 | 0 |  | 下限 |
| `max_value` | 整数 |  |  |  | 上限 |
| `unit` | 文本 |  |  |  | 单位 |
| `visible` | 整数 | 是 | 1 | CHECK(visible IN (0, 1)) | 是否在状态面板显示 |

**表级约束**

- `UNIQUE (game_id, key)`

### `item_defs`

作品自定义的物品元数据。玩家实际持有情况在 runs.state 里。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `key` | 文本 | 是 |  |  | itm_key |
| `name` | 文本 | 是 |  |  | 名称 |
| `description` | 文本 |  |  |  | 描述 |
| `icon` | 文本 |  |  |  | 图标 |
| `stackable` | 整数 | 是 | 1 | CHECK(stackable IN (0, 1)) | 是否可堆叠 |
| `max_stack` | 整数 | 是 | 99 |  | 堆叠上限 |

**表级约束**

- `UNIQUE (game_id, key)`

### `location_defs`

作品自定义的地点，parent_key 支持层级（如「旅店 → 二楼」）。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `key` | 文本 | 是 |  |  | loc_inn_hall |
| `name` | 文本 | 是 |  |  | 名称 |
| `description` | 文本 |  |  |  | 描述 |
| `parent_key` | 文本 |  |  |  | 层级地点：大厅 → 二楼 |
| `sort_order` | 整数 | 是 | 0 |  | 排序序号 |

**表级约束**

- `UNIQUE (game_id, key)`

---

## 三、剧情域

*AI 生成出来的剧情图（节点与选项）*

### `story_nodes`

剧情节点。scope 区分「作品内容」与「玩家私有分支」，version 支持作品改版。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 | 是 |  |  | 对应 games.current_version |
| `node_key` | 文本 | 是 |  |  | canonical = 作品内容；run = 玩家游玩时 AI 实时生成，仅本局可见 |
| `scope` | 文本 | 是 | 'canonical' | CHECK(scope IN ('canonical', 'run')) | 归属：canonical 作品内容 / run 玩家私有 |
| `run_id` | 整数 |  |  | → runs.id ·删除时 CASCADE | scope='run' 时非空 |
| `node_type` | 文本 | 是 | 'normal' | CHECK(node_type IN ('opening', 'normal', 'ending')) | 节点类型：opening / normal / ending |
| `title` | 文本 |  |  |  | 标题 |
| `body` | 文本 | 是 |  |  | 剧情正文 |
| `author_type` | 文本 | 是 | 'ai' | CHECK(author_type IN ('ai', 'human')) | 作者：ai 生成 / human 人工编辑过 |
| `ending_type` | 文本 |  |  | CHECK(ending_type IN ('good', 'bad', 'hidden', 'neutral')) | 结局类型：good / bad / hidden / neutral |
| `ending_name` | 文本 |  |  |  | 结局名称 |
| `depth` | 整数 | 是 | 0 |  | 距开场步数，控制树深度 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `CONSTRAINT ck_nodes_ending CHECK (node_type <> 'ending' OR ending_type IS NOT NULL)`
- `CONSTRAINT ck_nodes_scope CHECK ((scope = 'canonical' AND run_id IS NULL) OR (scope = 'run' AND run_id IS NOT NULL))`

### `choices`

节点上的选项（有向边），stat_delta 描述选择带来的数值变化。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `node_id` | 整数 | 是 |  | → story_nodes.id ·删除时 CASCADE | 所属/指向的剧情节点 |
| `order_index` | 整数 | 是 | 0 |  | 同节点内的排序 |
| `choice_text` | 文本 | 是 |  |  | 选项文案 |
| `to_node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | 生成中可为空 |
| `stat_delta` | 文本 | 是 | '{}' | CHECK(json_valid(stat_delta)) | {"hp": -10, "affinity_elder": 1} |
| `conditions` | 文本 | 是 | '[]' | CHECK(json_valid(conditions)) | [{"stat":"money","op":">=","value":20}] |
| `source` | 文本 | 是 | 'ai' | CHECK(source IN ('ai', 'human')) | 来源：ai / human |

**表级约束**

- `UNIQUE (node_id, order_index)`

---

## 四、游玩域

*一次具体游玩实例：状态、足迹、存档、ReAct 过程、长期记忆*

### `runs`

一次游玩实例（一局）。state 是当前状态的权威快照。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 | 是 |  |  | 开局时锁定的内容版本 |
| `user_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 所属用户 |
| `share_link_id` | 整数 |  |  | → share_links.id ·删除时 SET NULL | 来源分享链接（直接从作品页进入则为空） |
| `status` | 文本 | 是 | 'active' | CHECK(status IN ('active', 'ended', 'abandoned')) | 状态 |
| `current_step_id` | 整数 |  |  | → run_steps.id ·删除时 SET NULL | 回退=改这个指针 |
| `current_node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | "flags":["met_elder"]} |
| `state` | 文本 | 是 | '{"stats":{},"inventory":[],"time":{"day":1,"phase":"morning"},"flags":[]}' | CHECK(json_valid(state)) | 当前状态快照（JSON：stats / inventory / time / flags） |
| `turn_count` | 整数 | 是 | 0 |  | 已完成回合数 |
| `ending_node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | 达成的结局节点 |
| `started_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 开始时间 |
| `last_active_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 最后活跃时间 |
| `ended_at` | 文本 |  |  |  | 结束时间 |

### `run_steps`

交互足迹，只追加不修改；parent_step_id 自引用构成树，回退只改指针。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `run_id` | 整数 | 是 |  | → runs.id ·删除时 CASCADE | 所属游玩实例 |
| `parent_step_id` | 整数 |  |  | → run_steps.id ·删除时 CASCADE | 父步骤，构成步骤树 |
| `seq` | 整数 | 是 |  |  | 单调递增，仅用于排序 |
| `action_type` | 文本 | 是 |  | CHECK(action_type IN ('start', 'choice', 'free_text', 'system', 'rewind')) | 动作类型：start / choice / free_text / system / rewind |
| `choice_id` | 整数 |  |  | → choices.id ·删除时 SET NULL | 本次操作对应的选项（自由输入时为空） |
| `input_text` | 文本 |  |  |  | 自由输入原文 |
| `node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | 结果节点 |
| `state_after` | 文本 | 是 | '{}' | CHECK(json_valid(state_after)) | 该步骤执行后的状态快照（JSON） |
| `ai_task_id` | 整数 |  |  | → generation_tasks.id ·删除时 SET NULL | 触发本次步骤的 AI 任务（可空） |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `run_saves`

手动存档，一局最多 5 个槽位。只存指针与快照，不复制历史。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `run_id` | 整数 | 是 |  | → runs.id ·删除时 CASCADE | 所属游玩实例 |
| `user_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 所属用户 |
| `slot_no` | 整数 | 是 |  | CHECK(slot_no BETWEEN 1 AND 5) | 存档位编号 1–5 |
| `name` | 文本 |  |  |  | 名称 |
| `step_id` | 整数 | 是 |  | → run_steps.id ·删除时 RESTRICT | 存档时指向的步骤 |
| `node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | 所属/指向的剧情节点 |
| `snapshot` | 文本 | 是 |  | CHECK(json_valid(snapshot)) | 存 runs.state 的拷贝 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (run_id, slot_no)`

### `agent_traces`

ReAct 每一步的思考/工具/观察，用于追溯与成本分析，不面向玩家。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `run_id` | 整数 |  |  | → runs.id ·删除时 CASCADE | 所属游玩实例 |
| `task_id` | 整数 |  |  | → generation_tasks.id ·删除时 SET NULL | 所属 AI 任务 |
| `turn` | 整数 | 是 |  |  | 对应 runs.turn_count |
| `step_no` | 整数 | 是 |  |  | 该回合内第几步，从 1 开始 |
| `thought` | 文本 |  |  |  | 模型推理内容（Thought） |
| `tool_name` | 文本 |  |  |  | 调用的工具名（Action）；最后一步为 NULL |
| `tool_args` | 文本 |  |  | CHECK(tool_args IS NULL OR json_valid(tool_args)) | 工具入参（JSON） |
| `observation` | 文本 |  |  |  | 工具返回（Observation），超长截断 |
| `final_text` | 文本 |  |  |  | 该步产出的正文，通常只有最终步骤有 |
| `tokens_in` | 整数 | 是 | 0 |  | 输入 token 数 |
| `tokens_out` | 整数 | 是 | 0 |  | 输出 token 数 |
| `latency_ms` | 整数 |  |  |  | 耗时（毫秒） |
| `status` | 文本 | 是 | 'ok' | CHECK(status IN ('ok', 'error', 'timeout')) | 状态 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `run_summaries`

长局上下文压缩，每 K 回合一条摘要。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `run_id` | 整数 | 是 |  | → runs.id ·删除时 CASCADE | 所属游玩实例 |
| `upto_turn` | 整数 | 是 |  |  | 摘要覆盖到第几回合 |
| `summary` | 文本 | 是 |  |  | 压缩后的摘要正文 |
| `tokens_used` | 整数 | 是 | 0 |  | 本次摘要消耗的 token |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (run_id, upto_turn)`

### `story_memory`

故事记忆：世界观、角色卡、场景、摘要、关键选择。SQLite 版暂不存向量。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 |  |  | → games.id ·删除时 CASCADE | 所属作品 |
| `run_id` | 整数 |  |  | → runs.id ·删除时 CASCADE | 所属游玩实例 |
| `user_id` | 整数 |  |  | → users.id ·删除时 SET NULL | 所属用户 |
| `kind` | 文本 | 是 |  | CHECK(kind IN ('world', 'character', 'scene', 'summary', 'choice')) | 种类（各表取值见 CHECK 约束） |
| `source_node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | 来源剧情节点 |
| `text` | 文本 | 是 |  |  | 记忆正文 |
| `importance` | 整数 | 是 | 3 | CHECK(importance BETWEEN 1 AND 5) | 重要度 1–5，检索时用于排序 |
| `embedding_ref` | 文本 |  |  |  | 预留：外部向量库/文件引用 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

---

## 五、AI 域

*模型调用、提示词、合规检查*

### `generation_tasks`

一次 AI 生成任务：参数、token、费用、状态，是成本核算与限流的依据。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 |  |  | → games.id ·删除时 CASCADE | 整局生成时有值 |
| `run_id` | 整数 |  |  | → runs.id ·删除时 CASCADE | 续写时有值 |
| `user_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 所属用户 |
| `task_type` | 文本 | 是 |  | CHECK(task_type IN ('full_generate', 'continue',                                          'regenerate_node', 'expand_choice')) | 任务类型：full_generate / continue / regenerate_node / expand_choice |
| `status` | 文本 | 是 | 'pending' | CHECK(status IN ('pending', 'running', 'succeeded', 'failed')) | 状态 |
| `trigger_node_id` | 整数 |  |  | → story_nodes.id ·删除时 SET NULL | 触发本次生成的节点 |
| `prompt_code` | 文本 |  |  |  | 对应 prompt_templates.code |
| `model` | 文本 |  |  |  | 模型名，空则用全局默认 |
| `temperature` | 小数 |  |  |  | 采样温度 0–2 |
| `request_preview` | 文本 |  |  |  | 截断后的请求，便于排查（勿存密钥） |
| `input_tokens` | 整数 | 是 | 0 |  | 输入 token 总数 |
| `output_tokens` | 整数 | 是 | 0 |  | 输出 token 总数 |
| `cost_usd` | 小数 | 是 | 0 |  | 本次调用费用（美元） |
| `error_code` | 文本 |  |  |  | 错误码 |
| `error_message` | 文本 |  |  |  | 错误信息 |
| `started_at` | 文本 |  |  |  | 开始时间 |
| `finished_at` | 文本 |  |  |  | 结束时间 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `CONSTRAINT ck_task_target CHECK (game_id IS NOT NULL OR run_id IS NOT NULL)`

### `prompt_templates`

提示词模板，按 code + version 管理，可灰度切换。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `code` | 文本 | 是 |  |  | system_generate / system_continue |
| `version` | 整数 | 是 | 1 |  | 版本号 |
| `content` | 文本 | 是 |  |  | 模板正文 |
| `is_active` | 整数 | 是 | 1 | CHECK(is_active IN (0, 1)) | 是否启用 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (code, version)`

### `moderation_records`

输入/输出的合规检查结果。多态关联 steps / tasks / games。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `direction` | 文本 | 是 |  | CHECK(direction IN ('input', 'output')) | 方向：input 用户输入 / output 模型输出 |
| `subject_type` | 文本 | 是 |  | CHECK(subject_type IN ('run_step', 'generation_task', 'game')) | 检查对象类型 |
| `subject_id` | 整数 | 是 |  |  | 多态，不建外键 |
| `user_id` | 整数 |  |  | → users.id ·删除时 SET NULL | 所属用户 |
| `verdict` | 文本 | 是 |  | CHECK(verdict IN ('pass', 'block', 'review')) | 判定：pass / block / review |
| `categories` | 文本 | 是 | '[]' | CHECK(json_valid(categories)) | 命中的违规分类（JSON 数组） |
| `provider` | 文本 |  |  |  | 内部词库 / 第三方审核 API |
| `content_hash` | 文本 |  |  |  | 只存哈希，避免留敏感原文 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

---

## 六、生成流水线域

*对应 architecture.md §3：①~⑦ 七个阶段的编排、产物与质检*

### `pipeline_runs`

一次「整局生成」的编排实例，串联 architect→write→validate→repair→compile。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 |  |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 |  |  |  | 版本号 |
| `user_id` | 整数 |  |  | → users.id ·删除时 SET NULL | 所属用户 |
| `request_id` | 文本 |  |  |  | req_01J...，贯穿日志 |
| `idempotency_key` | 文本 |  |  |  | runId + stage，防重复计费 |
| `status` | 文本 | 是 | 'pending' | CHECK(status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')) | 状态 |
| `current_stage` | 文本 |  |  |  | 当前所处阶段 |
| `total_tokens` | 整数 | 是 | 0 |  | 该次生成累计 token |
| `total_cost_usd` | 小数 | 是 | 0 |  | 该次生成累计费用（美元） |
| `error_code` | 文本 |  |  |  | 错误码 |
| `error_message` | 文本 |  |  |  | 错误信息 |
| `started_at` | 文本 |  |  |  | 开始时间 |
| `finished_at` | 文本 |  |  |  | 结束时间 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `pipeline_stages`

单个阶段的执行记录，含 attempt、耗时、token、原始产物 artifact。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `pipeline_run_id` | 整数 | 是 |  | → pipeline_runs.id ·删除时 CASCADE | 所属生成任务 |
| `stage` | 文本 | 是 |  | CHECK(stage IN ('architect', 'write', 'validate', 'repair', 'compile')) | 阶段：architect / write / validate / repair / compile |
| `attempt` | 整数 | 是 | 1 | CHECK(attempt BETWEEN 1 AND 3) | 该阶段第几次尝试（1–3，最多重试 2 次） |
| `parent_stage_id` | 整数 |  |  | → pipeline_stages.id ·删除时 SET NULL | 上游阶段（repair 指向失败的 validate） |
| `status` | 文本 | 是 | 'pending' | CHECK(status IN ('pending', 'running', 'succeeded', 'failed', 'skipped')) | 状态 |
| `model` | 文本 |  |  |  | 模型名，空则用全局默认 |
| `prompt_code` | 文本 |  |  |  | 对应的提示词模板编码 |
| `tokens_in` | 整数 | 是 | 0 |  | 输入 token 数 |
| `tokens_out` | 整数 | 是 | 0 |  | 输出 token 数 |
| `cost_usd` | 小数 | 是 | 0 |  | 费用（美元） |
| `latency_ms` | 整数 |  |  |  | 耗时（毫秒） |
| `artifact` | 文本 |  |  |  | 阶段原始 JSON（超 32KB 截断） |
| `artifact_truncated` | 整数 | 是 | 0 | CHECK(artifact_truncated IN (0, 1)) | 产物是否被截断 |
| `artifact_path` | 文本 |  |  |  | 完整版落对象存储时的路径 |
| `error_code` | 文本 |  |  |  | 错误码 |
| `error_message` | 文本 |  |  |  | 错误信息 |
| `started_at` | 文本 |  |  |  | 开始时间 |
| `finished_at` | 文本 |  |  |  | 结束时间 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `pipeline_issues`

Validator 报出的问题逐条落库，「JSON 一次通过率」「断链率」都靠它算。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `stage_id` | 整数 | 是 |  | → pipeline_stages.id ·删除时 CASCADE | 所属阶段执行记录 |
| `severity` | 文本 | 是 | 'error' | CHECK(severity IN ('error', 'warning', 'info')) | 严重级别：error / warning / info |
| `code` | 文本 | 是 |  |  | JSON_INVALID / NODE_UNREACHABLE / CHOICE_TOO_FEW ... |
| `message` | 文本 |  |  |  | 问题描述 |
| `node_key` | 文本 |  |  |  | 涉及的节点标识 |
| `resolved_by_stage_id` | 整数 |  |  | → pipeline_stages.id ·删除时 SET NULL | 被哪个后续阶段修复 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `story_bibles`

故事圣经：主题、核心冲突、真相、结局方向、角色动机。②③④⑤ 阶段共用。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 | 是 |  |  | 版本号 |
| `title` | 文本 |  |  |  | 标题 |
| `subtitle` | 文本 |  |  |  | 副标题 |
| `theme` | 文本 |  |  |  | 主题 |
| `core_conflict` | 文本 |  |  |  | 核心冲突 |
| `truth` | 文本 |  |  |  | 真相（只给 AI，不展示给玩家） |
| `ending_directions` | 文本 | 是 | '[]' | CHECK(json_valid(ending_directions)) | 结局方向列表（JSON 数组） |
| `character_motives` | 文本 | 是 | '{}' | CHECK(json_valid(character_motives)) | 角色动机表（JSON） |
| `raw_json` | 文本 |  |  | CHECK(raw_json IS NULL OR json_valid(raw_json)) | 原始 blueprint |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (game_id, version)`

### `game_versions`

作品版本快照，支持撤销与发布回滚（architecture.md 5.6）。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 | 是 |  |  | 版本号 |
| `label` | 文本 |  |  |  | 版本标签，如「初稿」「修改第二幕」 |
| `status` | 文本 | 是 | 'draft' | CHECK(status IN ('draft', 'published', 'archived')) | 状态 |
| `parent_version` | 整数 |  |  |  | 从哪一版改来，NULL 为初版 |
| `node_count` | 整数 | 是 | 0 |  | 该版本节点数 |
| `ending_count` | 整数 | 是 | 1 |  | 该版本结局数 |
| `diff_summary` | 文本 |  |  |  | 相对父版本改了什么 |
| `created_by` | 整数 |  |  | → users.id ·删除时 SET NULL | 创建者 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (game_id, version)`

### `locked_facts`

世界观硬约束，禁止模型改写（architecture.md 7.2 lockedFacts）。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 | 是 | 1 |  | 版本号 |
| `kind` | 文本 | 是 |  | CHECK(kind IN ('world', 'character', 'relationship', 'item', 'rule')) | 种类（各表取值见 CHECK 约束） |
| `subject` | 文本 |  |  |  | 实体 key，如 chr_elder |
| `fact` | 文本 | 是 |  |  | 约束内容，模型不得改写 |
| `source` | 文本 | 是 | 'bible' | CHECK(source IN ('intake', 'bible', 'manual')) | 来源：intake / bible / manual |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

---

## 七、运营域

*分享、评价、举报、审计、限流*

### `share_links`

分享链接。token 不可枚举，version 钉住分享时的作品版本。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `version` | 整数 | 是 |  |  | 钉住版本，作者改稿不影响分享页 |
| `token` | 文本 | 是 |  | UNIQUE | 不可枚举的随机串 |
| `permission` | 文本 | 是 | 'play' | CHECK(permission IN ('play', 'remix')) | 权限：play 只能玩 / remix 可改编 |
| `created_by` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 创建者 |
| `expires_at` | 文本 |  |  |  | 过期时间 |
| `revoked_at` | 文本 |  |  |  | 撤销时间 |
| `play_count` | 整数 | 是 | 0 |  | 游玩次数 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `reviews`

玩家对作品的评分与评论，一人一条。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `game_id` | 整数 | 是 |  | → games.id ·删除时 CASCADE | 所属作品 |
| `user_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 所属用户 |
| `rating` | 整数 | 是 |  | CHECK(rating BETWEEN 1 AND 5) | 评分 1–5 |
| `comment` | 文本 |  |  |  | 评论内容 |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

**表级约束**

- `UNIQUE (game_id, user_id)`

### `reports`

举报记录，target 为多态引用。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `target_type` | 文本 | 是 |  | CHECK(target_type IN ('game', 'review', 'user')) | 目标类型（多态） |
| `target_id` | 整数 | 是 |  |  | 目标 ID（多态） |
| `reporter_id` | 整数 |  |  | → users.id ·删除时 SET NULL | 举报人 |
| `reason` | 文本 | 是 |  |  | 举报原因 |
| `status` | 文本 | 是 | 'open' | CHECK(status IN ('open', 'resolved', 'dismissed')) | 状态 |
| `handled_by` | 整数 |  |  | → users.id ·删除时 SET NULL | 处理人（管理员） |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |
| `handled_at` | 文本 |  |  |  | 处理时间 |

### `audit_logs`

管理员操作审计流水。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `id` | 整数 | 是 |  | PK | 主键 |
| `actor_id` | 整数 |  |  | → users.id ·删除时 SET NULL | 操作人 |
| `action` | 文本 | 是 |  |  | game.publish / user.ban ... |
| `target_type` | 文本 |  |  |  | 目标类型（多态） |
| `target_id` | 整数 |  |  |  | 目标 ID（多态） |
| `detail` | 文本 | 是 | '{}' | CHECK(json_valid(detail)) | 操作详情（JSON） |
| `created_at` | 文本 | 是 | (datetime('now', 'localtime')) |  | 创建时间 |

### `usage_counters`

按天累计的用量计数，用于限流。

| 字段 | 类型 | 必填 | 默认值 | 约束 / 外键 | 说明 |
|---|---|---|---|---|---|
| `user_id` | 整数 | 是 |  | → users.id ·删除时 CASCADE | 所属用户 |
| `kind` | 文本 | 是 |  | CHECK(kind IN ('generate', 'continue', 'ai_tokens')) | 计数类型：generate / continue / ai_tokens |
| `day` | 文本 | 是 |  |  | YYYY-MM-DD |
| `count` | 整数 | 是 | 0 |  | 累计次数 |

**表级约束**

- `PRIMARY KEY (user_id, kind, day)`

---

## 附录：外键关系

| 子表 | 字段 | 父表 | 删除行为 |
|---|---|---|---|
| `oauth_accounts` | `user_id` | `users(id ·删除时 CASCADE)` | CASCADE |
| `games` | `author_id` | `users(id ·删除时 CASCADE)` | CASCADE |
| `background_settings` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `generation_params` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `characters` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `stat_defs` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `item_defs` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `location_defs` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `story_nodes` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `story_nodes` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `choices` | `node_id` | `story_nodes(id ·删除时 CASCADE)` | CASCADE |
| `choices` | `to_node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `share_links` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `share_links` | `created_by` | `users(id ·删除时 CASCADE)` | CASCADE |
| `runs` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `runs` | `user_id` | `users(id ·删除时 CASCADE)` | CASCADE |
| `runs` | `share_link_id` | `share_links(id ·删除时 SET NULL)` | SET NULL |
| `runs` | `current_step_id` | `run_steps(id ·删除时 SET NULL)` | SET NULL |
| `runs` | `current_node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `runs` | `ending_node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `run_steps` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `run_steps` | `parent_step_id` | `run_steps(id ·删除时 CASCADE)` | CASCADE |
| `run_steps` | `choice_id` | `choices(id ·删除时 SET NULL)` | SET NULL |
| `run_steps` | `node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `run_steps` | `ai_task_id` | `generation_tasks(id ·删除时 SET NULL)` | SET NULL |
| `run_saves` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `run_saves` | `user_id` | `users(id ·删除时 CASCADE)` | CASCADE |
| `run_saves` | `step_id` | `run_steps(id ·删除时 RESTRICT)` | RESTRICT |
| `run_saves` | `node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `generation_tasks` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `generation_tasks` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `generation_tasks` | `user_id` | `users(id ·删除时 CASCADE)` | CASCADE |
| `generation_tasks` | `trigger_node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `agent_traces` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `agent_traces` | `task_id` | `generation_tasks(id ·删除时 SET NULL)` | SET NULL |
| `run_summaries` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `moderation_records` | `user_id` | `users(id ·删除时 SET NULL)` | SET NULL |
| `story_bibles` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `game_versions` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `game_versions` | `created_by` | `users(id ·删除时 SET NULL)` | SET NULL |
| `pipeline_runs` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `pipeline_runs` | `user_id` | `users(id ·删除时 SET NULL)` | SET NULL |
| `pipeline_stages` | `pipeline_run_id` | `pipeline_runs(id ·删除时 CASCADE)` | CASCADE |
| `pipeline_stages` | `parent_stage_id` | `pipeline_stages(id ·删除时 SET NULL)` | SET NULL |
| `pipeline_issues` | `stage_id` | `pipeline_stages(id ·删除时 CASCADE)` | CASCADE |
| `pipeline_issues` | `resolved_by_stage_id` | `pipeline_stages(id ·删除时 SET NULL)` | SET NULL |
| `locked_facts` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `story_memory` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `story_memory` | `run_id` | `runs(id ·删除时 CASCADE)` | CASCADE |
| `story_memory` | `user_id` | `users(id ·删除时 SET NULL)` | SET NULL |
| `story_memory` | `source_node_id` | `story_nodes(id ·删除时 SET NULL)` | SET NULL |
| `reviews` | `game_id` | `games(id ·删除时 CASCADE)` | CASCADE |
| `reviews` | `user_id` | `users(id ·删除时 CASCADE)` | CASCADE |
| `reports` | `reporter_id` | `users(id ·删除时 SET NULL)` | SET NULL |
| `reports` | `handled_by` | `users(id ·删除时 SET NULL)` | SET NULL |
| `audit_logs` | `actor_id` | `users(id ·删除时 SET NULL)` | SET NULL |
| `usage_counters` | `user_id` | `users(id ·删除时 CASCADE)` | CASCADE |
