# 后端与数据库

当前仓库只有数据库模型和结构，没有可运行的业务后端。

## 目录

```text
code/backend/
├── README.md
└── database/
    ├── echoquest.db         SQLite 空库，31 张表 + 4 个视图
    ├── schema.sql           建表语句
    ├── data-model.md        数据模型说明
    ├── data-dictionary.md   字段字典
    └── init_db.py           从 schema.sql 重建数据库
```

## 数据库

类型：SQLite 3.35+  
文件：[`database/echoquest.db`](database/echoquest.db)  
当前状态：结构完整，所有业务表为空。

覆盖七个域：

- 身份：`users`、`oauth_accounts`
- 作品：`games`、`background_settings`、`generation_params`、角色/属性/物品/地点
- 剧情：`story_nodes`、`choices`
- 游玩：`runs`、`run_steps`、`run_saves`、`agent_traces`、`run_summaries`、`story_memory`
- AI：`generation_tasks`、`prompt_templates`、`moderation_records`
- 生成流水线：`pipeline_runs`、`pipeline_stages`、`pipeline_issues`、`story_bibles`、`game_versions`、`locked_facts`
- 运营：`share_links`、`reviews`、`reports`、`audit_logs`、`usage_counters`

重建数据库：

```bash
cd code/backend/database
python init_db.py
```

检查：

```bash
python -c "import sqlite3; c=sqlite3.connect('echoquest.db'); print(c.execute('pragma integrity_check').fetchone()); print(c.execute(\"select count(*) from sqlite_master where type='table'\").fetchone())"
```

推荐用 DB Browser for SQLite 或 DBeaver 打开。

## 与前端的关系

前端（[code/frontend](../frontend/README.md)）当前仍使用 `localStorage`，**不会**直接读取这个数据库。

前端固定请求以下接口：

| 方法 | 路径 | 责任 |
|---|---|---|
| GET | `/api/health` | 返回 AI 可用性、模型和供应商 |
| POST | `/api/agent/architect` | 背景 → 故事圣经 + 节点拓扑 |
| POST | `/api/agent/write` | 故事圣经 → 节点正文 + 选项 |
| POST | `/api/agent/repair` | 结构问题 → 修复后的节点 |

接口字段、JSON Schema 和流水线设计见 [`docs/software/architecture.md`](../../docs/software/architecture.md)。

## 后端落地时要补的部分

1. 使用 FastAPI 或 Python 标准库实现上述四个接口。
2. 模型密钥只放服务端环境变量，不进入前端。
3. 用 `pipeline_runs` / `pipeline_stages` 记录每次生成。
4. 生成成功后把作品写入 `games`、`story_nodes`、`choices`。
5. 接入账号后，把作者从匿名 guest 迁移到真实 `users.id`。
6. 提供作品和存档 API，替换前端 `localStorage`。
7. 每个 SQLite 连接执行 `PRAGMA foreign_keys = ON`，建议开启 WAL 和 `busy_timeout`。

## 数据模型注意事项

- `games.author_id` 和 `runs.user_id` 都是必填。没有账号系统时，需要先插入约定好的 guest 用户（见 `schema.sql` 头部说明）。
- 数据库文件本身是空库，不包含任何账号、作品或密钥。
- `schema.sql` 是 SQLite 版本；迁移到 PostgreSQL 时需按文件末尾的差异说明转换。
