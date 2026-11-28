# EchoQuest Demo 改动包

这是本次「单机 Demo 版五件套」的代码文件，按原项目目录结构整理。直接覆盖到项目根目录即可，不要单独运行 `server.py` 做完整站点（静态页面不在这个改动包里）。

## 包含文件

```text
EchoQuest-Demo-Changes/
├── server.py                    Agent API、混合 RAG、工具白名单、护栏接入
├── agent_runtime.py             Plan-and-Solve 计划 + 规则工具路由
├── guardrails.py                本地 PII 脱敏 + 关键词审核
├── memory_store.py              SQLite Demo 记忆
├── tools/
│   ├── whitelist.json           9 个固定工具路由
│   └── README.md                白名单字段与扩展说明
├── knowledge/
│   ├── structure.md
│   ├── style.md
│   ├── characters.md
│   ├── safety.md
│   └── genres/
│       ├── suspense.md
│       ├── romance.md
│       ├── scifi.md
│       ├── adventure.md
│       └── apocalypse.md
└── deploy/
    └── echoquest.service        SQLite data/ 可写配置
```

## 覆盖方式

在项目根目录执行：

```bash
cp -r EchoQuest-Demo-Changes/* .
mkdir -p data
```

`data/` 是 SQLite 记忆文件目录，不要提交到 Git。

## 启动

```bash
python3 server.py
```

注意：`server.py` 启动时会强制读取 `tools/whitelist.json` 和 `knowledge/*.md`。文件缺失会直接启动失败，这是故意设计的 fail-closed。

## 新增接口

| 接口 | 作用 |
|---|---|
| `POST /api/agent/plan` | Plan-and-Solve 计划图 |
| `POST /api/tools/route` | 规则工具路由 |
| `GET /api/tools` | 查看白名单工具 |
| `POST /api/memory/save` | 保存作品到 SQLite |
| `POST /api/memory/load` | 读取 SQLite 作品 |
| `POST /api/safety/check` | PII / 关键词检查 |
| `POST /api/knowledge/search` | 混合 RAG 检索 |
| `GET /api/health` | 健康检查，含 `rag` 标记 |

## 快速验证

```bash
curl -s http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:8000/api/tools
```

计划：

```bash
curl -s -X POST http://127.0.0.1:8000/api/agent/plan \
  -H 'Content-Type: application/json' \
  -d '{"background":"雨夜电影院胶片出现明天的新闻","genreLabel":"悬疑","endingCount":3}'
```

知识检索：

```bash
curl -s -X POST http://127.0.0.1:8000/api/knowledge/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"月球 空间站 科幻","topK":3}'
```

记忆：

```bash
curl -s -X POST http://127.0.0.1:8000/api/memory/save \
  -H 'Content-Type: application/json' \
  -d '{"gameId":"demo-1","title":"演示","payload":{"nodes":{}}}'
```

## 边界

- Plan-and-Solve：返回显式计划图，但执行器仍是现有固定流水线，不是动态重规划。
- 工具调用：规则路由 + 路由白名单，不是模型自主 Function Calling。
- 记忆：SQLite Demo，不是 Redis + PostgreSQL + pgvector。
- 护栏：本地正则/关键词，不是生产审核服务。
- RAG：BM25 + 128 维哈希向量 + 同主题图扩展，不是语义 embedding 或完整 GraphRAG。
- 这些都在 PPT 里明确写成 Demo 版，没有冒充生产实现。

## 已验证

```text
22 / 22 现有测试通过
GET  /api/tools             → 9 个工具
POST /api/agent/plan        → plan-and-solve
POST /api/tools/route       → repair_story_content
POST /api/memory/save/load  → 正常
POST /api/safety/check      → 手机号替换为 [PHONE]
POST /api/knowledge/search  → 返回 bm25/vector/graph 分数
```
