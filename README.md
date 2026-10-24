# EchoQuest · AI 互动文字游戏平台

EchoQuest（回响）是一个把一段世界观设定生成成可游玩互动叙事的 Web 原型。用户输入故事背景与参数，得到带角色、分支、属性、结局的可编辑故事；也可以直接进入已有作品游玩。

当前仓库的主实现是 Web 前端与 SQLite 数据模型。项目最初规划过 C++ 控制台版本，但该版本源码目前不在本仓库中。

## 当前能力

- 故事发现页与示例作品
- 创作工坊：背景输入、类型/基调/长度/结局数配置
- AI Agent 前端链路：架构 → 撰写 → 校验 → 修复 → 编译
- 无后端时自动降级到本地剧情引擎
- 创作台：故事树、节点编辑、角色与设定档案
- 游玩：选项、自由行动、属性、背包、历史回看、结局收集
- 自动存档、手动存档、Markdown 导出

## 快速开始

Web 前端无需安装依赖、无需构建：

```bash
cd code/frontend
python -m http.server 8080 --bind 127.0.0.1
```

Windows 也可以双击 `code/frontend/start.bat`。

打开 <http://127.0.0.1:8080>。

## 当前状态与边界

这是一个**前端可完整游玩、后端尚未实现**的原型：

- 页面会探测 `/api/health`；后端不可用时使用本地剧情引擎，因此可以直接演示。
- 作品、草稿、存档、结局保存在浏览器 `localStorage`。
- 真实 AI Agent、注册登录、跨设备同步、作品发布与审核尚未实现。
- SQLite 数据库已建好 31 张表和 4 个视图，但还没有接入页面。

相关说明：

- [前端说明](code/frontend/README.md)
- [后端与数据库说明](code/backend/README.md)
- [架构设计](docs/software/architecture.md)
- [功能需求](docs/requirements/functional_spec.md)

## 目录结构

```text
.
├── code/
│   ├── frontend/             Web 前端（可直接运行）
│   ├── backend/              SQLite 数据模型（暂无服务端代码）
│   └── core_engine/          C++ 核心引擎预留目录（空）
├── docs/
│   ├── requirements/         需求规格、用户故事
│   ├── software/             架构与数据设计
│   └── mgmt/                 项目管理文档
├── tests/                    测试预留目录
└── README.md
```

## 数据库

数据库文件：[`code/backend/database/echoquest.db`](code/backend/database/echoquest.db)

- SQLite 3.35+
- 31 张表 + 4 个视图
- 当前为空库，不含账号、作品或密钥

重建：

```bash
cd code/backend/database
python init_db.py
```

## 运行前提

- 静态前端：任意现代浏览器
- 本地服务器：Python 3（`http.server` 即可）
- AI 后端：尚未提供；需要按架构文档实现 `/api/health` 与 `/api/agent/*`
- 云端或 Ollama 模型：只有接入后端后才会生效

## 许可

本项目仅对指定协作者开放代码修改权限。外部用户仅可阅读源码，未经许可不得修改、二次分发或商用。详见 [LICENSE](LICENSE)。
