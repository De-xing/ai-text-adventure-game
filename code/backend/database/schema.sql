-- ============================================================================
-- EchoQuest 数据模型 v0.2 —— SQLite 版
--
-- 目标：SQLite 3.35+（实测环境 3.50.4）
-- 对齐：docs/software/architecture.md v1.3（Dynamic Flow）
-- 规模：31 张表 + 4 个视图
--
-- 用法：sqlite3 echoquest.db < schema.sql
--       或在 Python 里 exec(open('schema.sql').read())
--
-- 【匿名用户约定】架构当前还没有账号系统（architecture.md 2.2），
-- 但 games.author_id / runs.user_id 都是 NOT NULL。上线前先插入一个系统用户：
--     INSERT INTO users (id, email, nickname, role)
--     VALUES (1, 'guest@local', '匿名创作者', 'player');
-- 所有未登录产生的作品先挂它名下；接入登录后再把 author_id 改到真实用户。
--
-- 当前包只提供 SQLite 版；迁移到 PostgreSQL 的差异说明见文件末尾。
-- ============================================================================

-- 外键默认是关的，每个连接都要打开，否则 ON DELETE CASCADE 不生效
PRAGMA foreign_keys = ON;
-- 读写并发更好，Web 后端建议开启
PRAGMA journal_mode = WAL;


-- ============================================================================
-- 1. 身份域
-- ============================================================================

CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    email         TEXT    NOT NULL,
    password_hash TEXT,                              -- 第三方登录用户可为空
    nickname      TEXT    NOT NULL,
    avatar_url    TEXT,
    bio           TEXT,
    role          TEXT    NOT NULL DEFAULT 'player'
                          CHECK (role IN ('player', 'admin')),
    status        TEXT    NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'banned', 'deleted')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 邮箱大小写不敏感唯一（NOCASE 对 ASCII 生效，中文邮箱场景够用）
CREATE UNIQUE INDEX ux_users_email ON users (email COLLATE NOCASE);
CREATE INDEX ix_users_status ON users (status);


CREATE TABLE oauth_accounts (
    id           INTEGER PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider     TEXT    NOT NULL,                   -- github / wechat / google
    provider_uid TEXT    NOT NULL,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (provider, provider_uid)
);
CREATE INDEX ix_oauth_user ON oauth_accounts (user_id);


-- ============================================================================
-- 2. 作品域（创作者的东西，与"某个人在玩"无关）
-- ============================================================================

CREATE TABLE games (
    id              INTEGER PRIMARY KEY,
    author_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    summary         TEXT,
    cover_url       TEXT,
    genre           TEXT    NOT NULL DEFAULT 'other'
                    CHECK (genre IN ('suspense', 'romance', 'adventure',
                                     'apocalypse', 'scifi', 'other')),
    -- 状态机：draft → generating → private → under_review → published / rejected
    --         生成失败 → generation_failed → 可重试回 generating
    --         任何状态 → banned（管理员下架）
    status          TEXT    NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'generating', 'generation_failed',
                                      'private', 'under_review', 'published',
                                      'rejected', 'banned')),
    current_version INTEGER NOT NULL DEFAULT 1,
    play_count      INTEGER NOT NULL DEFAULT 0,
    published_at    TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_games_author ON games (author_id);
CREATE INDEX ix_games_feed   ON games (status, published_at DESC);


CREATE TABLE background_settings (
    game_id     INTEGER PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
    worldview   TEXT,                                -- 世界观
    protagonist TEXT,                                -- 主角
    era         TEXT,                                -- 时代
    tone        TEXT,                                -- 情绪基调
    raw_text    TEXT NOT NULL,                       -- 创作者原始输入（10–2000 字，长度在应用层校验）
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);


CREATE TABLE generation_params (
    game_id       INTEGER PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
    target_length TEXT    NOT NULL DEFAULT 'medium'
                          CHECK (target_length IN ('short', 'medium', 'long')),
    -- 架构约定：只允许单结局或三结局（architecture.md 2.1 / 4.4.1）
    ending_count  INTEGER NOT NULL DEFAULT 1 CHECK (ending_count IN (1, 3)),
    stats_enabled INTEGER NOT NULL DEFAULT 0 CHECK (stats_enabled IN (0, 1)),
    model         TEXT,                              -- 覆盖默认模型，NULL 用全局配置
    temperature   REAL    CHECK (temperature BETWEEN 0 AND 2),
    extra         TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(extra)),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);


-- ---- 作品的静态设定：角色 / 属性 / 物品 / 地点 ----------------------------

CREATE TABLE characters (
    id           INTEGER PRIMARY KEY,
    game_id      INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    key          TEXT    NOT NULL,                   -- chr_elder
    name         TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'npc'
                 CHECK (role IN ('protagonist', 'npc')),
    description  TEXT,
    secret       TEXT,                               -- 仅 AI 可读，不展示给玩家
    relationship TEXT    CHECK (relationship IN ('ally', 'enemy', 'stranger', 'neutral')),
    avatar_url   TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (game_id, key)
);


CREATE TABLE stat_defs (
    id            INTEGER PRIMARY KEY,
    game_id       INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    key           TEXT    NOT NULL,                  -- hp / money / affinity_elder
    name          TEXT    NOT NULL,
    initial_value INTEGER NOT NULL DEFAULT 0,
    min_value     INTEGER NOT NULL DEFAULT 0,
    max_value     INTEGER,
    unit          TEXT,
    visible       INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
    UNIQUE (game_id, key)
);


CREATE TABLE item_defs (
    id          INTEGER PRIMARY KEY,
    game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    key         TEXT    NOT NULL,                    -- itm_key
    name        TEXT    NOT NULL,
    description TEXT,
    icon        TEXT,
    stackable   INTEGER NOT NULL DEFAULT 1 CHECK (stackable IN (0, 1)),
    max_stack   INTEGER NOT NULL DEFAULT 99,
    UNIQUE (game_id, key)
);


CREATE TABLE location_defs (
    id          INTEGER PRIMARY KEY,
    game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    key         TEXT    NOT NULL,                    -- loc_inn_hall
    name        TEXT    NOT NULL,
    description TEXT,
    parent_key  TEXT,                                -- 层级地点：大厅 → 二楼
    sort_order  INTEGER NOT NULL DEFAULT 0,
    UNIQUE (game_id, key)
);


-- ============================================================================
-- 3. 剧情域（节点图，按版本隔离）
-- ============================================================================

CREATE TABLE story_nodes (
    id          INTEGER PRIMARY KEY,
    game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL,                    -- 对应 games.current_version
    node_key    TEXT    NOT NULL,                    -- 稳定标识：opening / n_0007 / end_good
    -- canonical = 作品内容；run = 玩家游玩时 AI 实时生成，仅本局可见
    scope       TEXT    NOT NULL DEFAULT 'canonical'
                CHECK (scope IN ('canonical', 'run')),
    run_id      INTEGER REFERENCES runs(id) ON DELETE CASCADE,  -- scope='run' 时非空
    node_type   TEXT    NOT NULL DEFAULT 'normal'
                CHECK (node_type IN ('opening', 'normal', 'ending')),
    title       TEXT,
    body        TEXT    NOT NULL,                    -- 剧情正文
    author_type TEXT    NOT NULL DEFAULT 'ai'
                CHECK (author_type IN ('ai', 'human')),  -- human = 人工编辑过
    ending_type TEXT    CHECK (ending_type IN ('good', 'bad', 'hidden', 'neutral')),
    ending_name TEXT,
    depth       INTEGER NOT NULL DEFAULT 0,          -- 距开场步数，控制树深度
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    CONSTRAINT ck_nodes_ending CHECK (node_type <> 'ending' OR ending_type IS NOT NULL),
    CONSTRAINT ck_nodes_scope  CHECK ((scope = 'canonical' AND run_id IS NULL)
                                   OR (scope = 'run'       AND run_id IS NOT NULL))
);

-- 作品内容：同一版本内 node_key 唯一
CREATE UNIQUE INDEX ux_nodes_canonical
    ON story_nodes (game_id, version, node_key)
    WHERE scope = 'canonical';

-- 游玩期节点：同一局内 node_key 唯一
CREATE UNIQUE INDEX ux_nodes_run
    ON story_nodes (run_id, node_key)
    WHERE scope = 'run';

CREATE INDEX ix_nodes_game_version ON story_nodes (game_id, version);
CREATE INDEX ix_nodes_run          ON story_nodes (run_id);


CREATE TABLE choices (
    id          INTEGER PRIMARY KEY,
    node_id     INTEGER NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    choice_text TEXT    NOT NULL,
    to_node_id  INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,  -- 生成中可为空
    stat_delta  TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(stat_delta)),
                                                     -- {"hp": -10, "affinity_elder": 1}
    conditions  TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(conditions)),
                                                     -- [{"stat":"money","op":">=","value":20}]
    source      TEXT    NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'human')),
    UNIQUE (node_id, order_index)
);
CREATE INDEX ix_choices_node ON choices (node_id);
CREATE INDEX ix_choices_to   ON choices (to_node_id);


-- ============================================================================
-- 4. 分享（先建，因为 runs 要引用）
-- ============================================================================

CREATE TABLE share_links (
    id         INTEGER PRIMARY KEY,
    game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version    INTEGER NOT NULL,                     -- 钉住版本，作者改稿不影响分享页
    token      TEXT    NOT NULL UNIQUE,              -- 不可枚举的随机串
    permission TEXT    NOT NULL DEFAULT 'play'
               CHECK (permission IN ('play', 'remix')),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT,
    revoked_at TEXT,
    play_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_share_game ON share_links (game_id);


-- ============================================================================
-- 5. 游玩域（单个玩家的实例）
-- ============================================================================

CREATE TABLE runs (
    id              INTEGER PRIMARY KEY,
    game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL,                -- 开局时锁定的内容版本
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_link_id   INTEGER REFERENCES share_links(id) ON DELETE SET NULL,
    status          TEXT    NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'ended', 'abandoned')),
    current_step_id INTEGER REFERENCES run_steps(id) ON DELETE SET NULL,  -- 回退=改这个指针
    current_node_id INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,
    -- 权威状态快照：本列是"现在"，run_steps.state_after 是"历史"
    -- {"stats":{"hp":100,"money":20},
    --  "inventory":[{"key":"itm_rope","qty":1}],
    --  "location":"loc_inn_hall",
    --  "time":{"day":1,"phase":"night"},
    --  "flags":["met_elder"]}
    state           TEXT    NOT NULL DEFAULT '{"stats":{},"inventory":[],"time":{"day":1,"phase":"morning"},"flags":[]}'
                    CHECK (json_valid(state)),
    turn_count      INTEGER NOT NULL DEFAULT 0,
    ending_node_id  INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,
    started_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    last_active_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    ended_at        TEXT
);
CREATE INDEX ix_runs_user ON runs (user_id, status);
CREATE INDEX ix_runs_game ON runs (game_id, status);


-- 步骤树：一次交互一行，只追加不修改
-- parent_step_id 自引用 → 形成树；回退只改 runs.current_step_id，不删任何行
CREATE TABLE run_steps (
    id             INTEGER PRIMARY KEY,
    run_id         INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    parent_step_id INTEGER REFERENCES run_steps(id) ON DELETE CASCADE,
    seq            INTEGER NOT NULL,                 -- 单调递增，仅用于排序
    action_type    TEXT    NOT NULL
                   CHECK (action_type IN ('start', 'choice', 'free_text', 'system', 'rewind')),
    choice_id      INTEGER REFERENCES choices(id) ON DELETE SET NULL,
    input_text     TEXT,                             -- 自由输入原文
    node_id        INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,  -- 结果节点
    state_after    TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(state_after)),
    ai_task_id     INTEGER REFERENCES generation_tasks(id) ON DELETE SET NULL,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_steps_run_seq ON run_steps (run_id, seq);
CREATE INDEX ix_steps_parent  ON run_steps (parent_step_id);


CREATE TABLE run_saves (
    id         INTEGER PRIMARY KEY,
    run_id     INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_no    INTEGER NOT NULL CHECK (slot_no BETWEEN 1 AND 5),
    name       TEXT,
    step_id    INTEGER NOT NULL REFERENCES run_steps(id) ON DELETE RESTRICT,
    node_id    INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,
    snapshot   TEXT    NOT NULL CHECK (json_valid(snapshot)),  -- 存 runs.state 的拷贝
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (run_id, slot_no)
);
CREATE INDEX ix_saves_run ON run_saves (run_id);


-- ============================================================================
-- 6. AI 域
-- ============================================================================

CREATE TABLE generation_tasks (
    id              INTEGER PRIMARY KEY,
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,  -- 整局生成时有值
    run_id          INTEGER REFERENCES runs(id) ON DELETE CASCADE,   -- 续写时有值
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type       TEXT    NOT NULL
                    CHECK (task_type IN ('full_generate', 'continue',
                                         'regenerate_node', 'expand_choice')),
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
    trigger_node_id INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,
    prompt_code     TEXT,                            -- 对应 prompt_templates.code
    model           TEXT,
    temperature     REAL,
    request_preview TEXT,                            -- 截断后的请求，便于排查（勿存密钥）
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    cost_usd        REAL    NOT NULL DEFAULT 0,
    error_code      TEXT,
    error_message   TEXT,
    started_at      TEXT,
    finished_at     TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    CONSTRAINT ck_task_target CHECK (game_id IS NOT NULL OR run_id IS NOT NULL)
);
CREATE INDEX ix_tasks_game ON generation_tasks (game_id, created_at DESC);
CREATE INDEX ix_tasks_run  ON generation_tasks (run_id, created_at DESC);
CREATE INDEX ix_tasks_user ON generation_tasks (user_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- ReAct 轨迹：一次玩家输入 = 一个 turn = N 个 step（思考 → 调工具 → 观察 → …）
-- 只追加不修改。用途：排查「这一步是谁改了我血量 / 钱花在哪个循环」
-- ----------------------------------------------------------------------------
CREATE TABLE agent_traces (
    id          INTEGER PRIMARY KEY,
    run_id      INTEGER REFERENCES runs(id) ON DELETE CASCADE,
    task_id     INTEGER REFERENCES generation_tasks(id) ON DELETE SET NULL,
    turn        INTEGER NOT NULL,                    -- 对应 runs.turn_count
    step_no     INTEGER NOT NULL,                    -- 该回合内第几步，从 1 开始
    thought     TEXT,                                -- 模型推理内容（Thought）
    tool_name   TEXT,                                -- 调用的工具名（Action）；最后一步为 NULL
    tool_args   TEXT CHECK (tool_args IS NULL OR json_valid(tool_args)),
    observation TEXT,                                -- 工具返回（Observation），超长截断
    final_text  TEXT,                                -- 该步产出的正文，通常只有最终步骤有
    tokens_in   INTEGER NOT NULL DEFAULT 0,
    tokens_out  INTEGER NOT NULL DEFAULT 0,
    latency_ms  INTEGER,
    status      TEXT    NOT NULL DEFAULT 'ok'
                CHECK (status IN ('ok', 'error', 'timeout')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_agent_run_turn ON agent_traces (run_id, turn, step_no);
CREATE INDEX ix_agent_tool     ON agent_traces (tool_name);


-- 长局上下文压缩：每 K 个回合落一条摘要，避免历史无限塞进 prompt
CREATE TABLE run_summaries (
    id          INTEGER PRIMARY KEY,
    run_id      INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    upto_turn   INTEGER NOT NULL,                    -- 摘要覆盖到第几回合
    summary     TEXT    NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (run_id, upto_turn)
);


CREATE TABLE prompt_templates (
    id         INTEGER PRIMARY KEY,
    code       TEXT    NOT NULL,                     -- system_generate / system_continue
    version    INTEGER NOT NULL DEFAULT 1,
    content    TEXT    NOT NULL,
    is_active  INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (code, version)
);


CREATE TABLE moderation_records (
    id           INTEGER PRIMARY KEY,
    direction    TEXT    NOT NULL CHECK (direction IN ('input', 'output')),
    subject_type TEXT    NOT NULL CHECK (subject_type IN ('run_step', 'generation_task', 'game')),
    subject_id   INTEGER NOT NULL,                   -- 多态，不建外键
    user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verdict      TEXT    NOT NULL CHECK (verdict IN ('pass', 'block', 'review')),
    categories   TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(categories)),
    provider     TEXT,                               -- 内部词库 / 第三方审核 API
    content_hash TEXT,                               -- 只存哈希，避免留敏感原文
    created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_mod_subject ON moderation_records (subject_type, subject_id);
CREATE INDEX ix_mod_verdict ON moderation_records (verdict, created_at DESC);


-- ============================================================================
-- 7. 生成流水线与记忆（对应 architecture.md §3 / §5.3 / §7.2）
-- ============================================================================

-- ② Planner 的产出：故事圣经。③ 分支规划、④ 撰写、⑤ 校验都要读它
CREATE TABLE story_bibles (
    id                INTEGER PRIMARY KEY,
    game_id           INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version           INTEGER NOT NULL,
    title             TEXT,
    subtitle          TEXT,
    theme             TEXT,                                  -- 主题
    core_conflict     TEXT,                                  -- 核心冲突
    truth             TEXT,                                  -- 真相（只给 AI，不展示给玩家）
    ending_directions TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(ending_directions)),
    character_motives TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(character_motives)),
    raw_json          TEXT CHECK (raw_json IS NULL OR json_valid(raw_json)),  -- 原始 blueprint
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (game_id, version)
);


-- 作品版本快照：支持撤销与发布回滚（architecture.md 5.6）
CREATE TABLE game_versions (
    id             INTEGER PRIMARY KEY,
    game_id        INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version        INTEGER NOT NULL,
    label          TEXT,
    status         TEXT    NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published', 'archived')),
    parent_version INTEGER,                                  -- 从哪一版改来，NULL 为初版
    node_count     INTEGER NOT NULL DEFAULT 0,
    ending_count   INTEGER NOT NULL DEFAULT 1,
    diff_summary   TEXT,                                     -- 相对父版本改了什么
    created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (game_id, version)
);
CREATE INDEX ix_versions_game ON game_versions (game_id, version DESC);


-- 一次「整局生成」的编排实例：贯穿 ①~⑦ 七个阶段
CREATE TABLE pipeline_runs (
    id              INTEGER PRIMARY KEY,
    game_id         INTEGER REFERENCES games(id) ON DELETE CASCADE,
    version         INTEGER,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    request_id      TEXT,                                    -- req_01J...，贯穿日志
    idempotency_key TEXT,                                    -- runId + stage，防重复计费
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
    current_stage   TEXT,
    total_tokens    INTEGER NOT NULL DEFAULT 0,
    total_cost_usd  REAL    NOT NULL DEFAULT 0,
    error_code      TEXT,
    error_message   TEXT,
    started_at      TEXT,
    finished_at     TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
-- 幂等：同一 idempotency_key 只会有一条
CREATE UNIQUE INDEX ux_pipeline_idem ON pipeline_runs (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
-- 并发：同一作品同时只允许一个进行中的生成任务
CREATE UNIQUE INDEX ux_pipeline_active ON pipeline_runs (game_id)
    WHERE status IN ('pending', 'running');
CREATE INDEX ix_pipeline_game ON pipeline_runs (game_id, created_at DESC);


-- 单个阶段的执行记录。attempt 上限 3（架构要求「每阶段最多 2 次总调用」+ 首次）
CREATE TABLE pipeline_stages (
    id                 INTEGER PRIMARY KEY,
    pipeline_run_id    INTEGER NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    stage              TEXT    NOT NULL
                       CHECK (stage IN ('architect', 'write', 'validate', 'repair', 'compile')),
    attempt            INTEGER NOT NULL DEFAULT 1 CHECK (attempt BETWEEN 1 AND 3),
    parent_stage_id    INTEGER REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    status             TEXT    NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'skipped')),
    model              TEXT,
    prompt_code        TEXT,
    tokens_in          INTEGER NOT NULL DEFAULT 0,
    tokens_out         INTEGER NOT NULL DEFAULT 0,
    cost_usd           REAL    NOT NULL DEFAULT 0,
    latency_ms         INTEGER,
    artifact           TEXT,                                 -- 阶段原始 JSON（超 32KB 截断）
    artifact_truncated INTEGER NOT NULL DEFAULT 0 CHECK (artifact_truncated IN (0, 1)),
    artifact_path      TEXT,                                 -- 完整版落对象存储时的路径
    error_code         TEXT,
    error_message      TEXT,
    started_at         TEXT,
    finished_at        TEXT,
    created_at         TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_stage_run ON pipeline_stages (pipeline_run_id, stage, attempt);


-- Validator 报出的问题，逐条落库。「JSON 一次通过率」「断链率」都靠它算
CREATE TABLE pipeline_issues (
    id                   INTEGER PRIMARY KEY,
    stage_id             INTEGER NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    severity             TEXT    NOT NULL DEFAULT 'error'
                         CHECK (severity IN ('error', 'warning', 'info')),
    code                 TEXT    NOT NULL,   -- JSON_INVALID / NODE_UNREACHABLE / CHOICE_TOO_FEW ...
    message              TEXT,
    node_key             TEXT,
    resolved_by_stage_id INTEGER REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    created_at           TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_issue_stage ON pipeline_issues (stage_id, severity);
CREATE INDEX ix_issue_code  ON pipeline_issues (code);


-- 世界观硬约束，禁止模型改写（architecture.md 7.2 lockedFacts）
CREATE TABLE locked_facts (
    id         INTEGER PRIMARY KEY,
    game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version    INTEGER NOT NULL DEFAULT 1,
    kind       TEXT    NOT NULL
               CHECK (kind IN ('world', 'character', 'relationship', 'item', 'rule')),
    subject    TEXT,                                         -- 实体 key，如 chr_elder
    fact       TEXT    NOT NULL,
    source     TEXT    NOT NULL DEFAULT 'bible'
               CHECK (source IN ('intake', 'bible', 'manual')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_locked_game ON locked_facts (game_id, version);


-- 故事记忆（architecture.md 5.3）。
-- SQLite 没有向量类型：先存文本 + importance，检索走结构化上下文 + 关键词；
-- 阶段 2 迁 PostgreSQL 后加 embedding vector(1536)，此表结构不用改
CREATE TABLE story_memory (
    id             INTEGER PRIMARY KEY,
    game_id        INTEGER REFERENCES games(id) ON DELETE CASCADE,
    run_id         INTEGER REFERENCES runs(id) ON DELETE CASCADE,
    user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind           TEXT    NOT NULL
                   CHECK (kind IN ('world', 'character', 'scene', 'summary', 'choice')),
    source_node_id INTEGER REFERENCES story_nodes(id) ON DELETE SET NULL,
    text           TEXT    NOT NULL,
    importance     INTEGER NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    embedding_ref  TEXT,                                     -- 预留：外部向量库/文件引用
    created_at     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_memory_game ON story_memory (game_id, kind);
CREATE INDEX ix_memory_run  ON story_memory (run_id, kind);


-- ============================================================================
-- 8. 运营域
-- ============================================================================

CREATE TABLE reviews (
    id         INTEGER PRIMARY KEY,
    game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (game_id, user_id)
);


CREATE TABLE reports (
    id          INTEGER PRIMARY KEY,
    target_type TEXT    NOT NULL CHECK (target_type IN ('game', 'review', 'user')),
    target_id   INTEGER NOT NULL,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason      TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'resolved', 'dismissed')),
    handled_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    handled_at  TEXT
);
CREATE INDEX ix_reports_open ON reports (status, created_at);


CREATE TABLE audit_logs (
    id          INTEGER PRIMARY KEY,
    actor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT    NOT NULL,                    -- game.publish / user.ban ...
    target_type TEXT,
    target_id   INTEGER,
    detail      TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(detail)),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX ix_audit_time ON audit_logs (created_at DESC);


-- 限流计数：FR-4.4
CREATE TABLE usage_counters (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind    TEXT    NOT NULL CHECK (kind IN ('generate', 'continue', 'ai_tokens')),
    day     TEXT    NOT NULL,                        -- YYYY-MM-DD
    count   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, kind, day)
);


-- ============================================================================
-- 9. 视图
-- ============================================================================

-- 作品内容节点（编辑器和生成器只看这些）
CREATE VIEW v_canonical_nodes AS
    SELECT * FROM story_nodes WHERE scope = 'canonical';


-- 某一局当前路径：从根到 current_step，按发生顺序排列
CREATE VIEW v_run_path AS
WITH RECURSIVE chain AS (
    SELECT s.id, s.run_id, s.parent_step_id, s.seq, 0 AS depth
    FROM run_steps s
    JOIN runs r ON r.id = s.run_id AND r.current_step_id = s.id
    UNION ALL
    SELECT s.id, s.run_id, s.parent_step_id, s.seq, c.depth + 1
    FROM run_steps s
    JOIN chain c ON s.id = c.parent_step_id
)
SELECT c.run_id,
       c.depth,
       s.id            AS step_id,
       s.seq,
       s.action_type,
       s.input_text,
       s.node_id,
       n.title,
       n.body,
       n.node_type,
       s.state_after
FROM chain c
JOIN run_steps s   ON s.id = c.id
JOIN story_nodes n ON n.id = s.node_id
ORDER BY c.run_id, c.depth DESC;


-- 结局达成率（运营看板）
CREATE VIEW v_ending_stats AS
SELECT g.id AS game_id, g.title,
       COUNT(r.id)            AS total_runs,
       COUNT(r.ending_node_id) AS finished_runs,
       ROUND(100.0 * COUNT(r.ending_node_id) / NULLIF(COUNT(r.id), 0), 1) AS finish_rate_pct
FROM games g
LEFT JOIN runs r ON r.game_id = g.id AND r.status = 'ended'
GROUP BY g.id, g.title;


-- 生成质量看板（architecture.md §1.4 的指标）
-- first_pass=1 表示首轮校验就过，没有触发 repair
CREATE VIEW v_pipeline_quality AS
SELECT pr.id                                AS pipeline_run_id,
       pr.game_id,
       pr.status,
       pr.total_cost_usd                    AS cost_usd,
       pr.total_tokens                      AS tokens,
       COUNT(ps.id)                         AS stage_count,
       SUM(CASE WHEN ps.status = 'failed' THEN 1 ELSE 0 END) AS failed_stages,
       (SELECT COUNT(*)
          FROM pipeline_stages vs
          JOIN pipeline_issues i ON i.stage_id = vs.id
         WHERE vs.pipeline_run_id = pr.id AND i.severity = 'error') AS error_count,
       (SELECT COUNT(*)
          FROM pipeline_stages vs
         WHERE vs.pipeline_run_id = pr.id
           AND vs.stage = 'validate' AND vs.attempt = 1
           AND vs.status = 'succeeded')     AS first_pass
FROM pipeline_runs pr
LEFT JOIN pipeline_stages ps ON ps.pipeline_run_id = pr.id
GROUP BY pr.id;


-- ============================================================================
-- 附：与 PostgreSQL 版的差异（以后要迁移时看这里）
-- ----------------------------------------------------------------------------
--  uuid                    → INTEGER PRIMARY KEY（SQLite 无 uuid 类型，
--                            也省掉 gen_random_uuid；要 uuid 就改 TEXT 存 32 位 hex）
--  timestamptz             → TEXT，datetime('now','localtime')
--  jsonb                   → TEXT + CHECK (json_valid(x))，查询用 json_extract()
--  boolean                 → INTEGER + CHECK (x IN (0,1))
--  numeric(3,2)            → REAL + CHECK
--  CREATE EXTENSION        → 删掉（不需要 pgcrypto）
--  ALTER TABLE ADD CONSTRAINT → 删掉，SQLite 不支持加外键，
--                            循环外键直接在 CREATE TABLE 里写（允许前向引用）
--  触发器 touch_updated_at  → 删掉，updated_at 由后端写入时更新
--  bigserial               → INTEGER PRIMARY KEY
-- ============================================================================
