# EchoQuest 前端

EchoQuest 互动叙事 Web 前端。当前版本由新版单文件原型拆分而来，包含完整的发现页、创作工坊、生成进度、创作台、游玩页、作品库与存档系统。

## 运行

无需安装依赖、无需构建。

Windows：

```text
start.bat
```

或者手动启动静态服务器：

```bash
cd code/frontend
python -m http.server 8080 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8080>。

也可以直接双击 `index.html`，但通过 HTTP 访问更接近真实环境；后端接口探测在 `file://` 下会自动跳过。

## 目录结构

```text
code/frontend/
├── index.html
├── css/
│   └── app.css
├── js/
│   ├── data.js              题材包、示例作品
│   ├── story-generator.js   本地剧情生成器
│   ├── agent-client.js      Agent API 客户端与故事编译
│   └── app.js               路由、页面、存档、游玩
├── start.bat
├── start.sh
└── README.md
```

脚本按 `data.js → story-generator.js → agent-client.js → app.js` 的顺序加载，全部是普通脚本，不需要构建工具。

## 后端行为

`agent-client.js` 会请求：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 探测 AI 后端是否可用 |
| POST | `/api/agent/architect` | 生成故事圣经和节点图 |
| POST | `/api/agent/write` | 生成节点正文与选项 |
| POST | `/api/agent/repair` | 修复结构问题 |

当前仓库没有实现这些接口，因此页面会：

1. 探测 `/api/health` 失败；
2. 自动降级到 `story-generator.js` 的本地剧情引擎；
3. 继续完整游玩。

后端实现和数据库结构见：

- [后端说明](../backend/README.md)
- [数据库目录](../backend/database/)
- [架构文档](../../docs/software/architecture.md)

## 本地数据

作品、草稿、存档、结局目前都保存在浏览器 `localStorage`：

| 键 | 内容 |
|---|---|
| `echoquest.userGames.v1` | 用户创建的故事 |
| `echoquest.overrides.v1` | 节点编辑覆盖 |
| `echoquest.draft.v1` | 创作页草稿 |
| `echoquest.saves.v1` | 手动存档 |
| `echoquest.autosave.v1` | 自动存档 |
| `echoquest.endings.v1` | 已解锁结局 |

清空浏览器数据会丢失这些内容，且无法跨设备同步。

## 尚未实现

- 账号注册、登录与服务端会话
- 服务端作品库与跨设备存档
- 真实 AI Agent 接口
- 作品发布、审核与公网分享
- 数据库读写

前端目前是可直接演示的本地原型，不是完整生产系统。

## 开发约定

- 保持无构建步骤，新增脚本继续用普通 `<script>` 按依赖顺序引入。
- 所有用户或 AI 文本插入 DOM 前继续使用 `escapeHtml()`。
- 页面调用后端的代码集中在 `agent-client.js`，不要把 `fetch` 分散到各渲染函数。
- 页面接口使用绝对路径 `/api/...`，部署在子目录时需要反向代理。
- Google Fonts 仅在联网时生效，离线会回退到系统中文字体。
