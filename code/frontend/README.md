# EchoQuest 前端（互动叙事原型）

由 `EchoQuest-单文件版(1).html` 拆分而来的无构建静态前端，保留原型的全部页面与交互：

- 发现故事 / 故事广场
- 创作工坊：背景输入、参数配置、生成进度、开场预览
- 创作台：故事树、节点编辑、角色与设定档案
- 游玩页：剧情、选项、自由行动、属性、背包、结局
- 我的作品 / 存档 / 历史 / 分享

当前是**纯前端本地原型**，没有登录注册、真实 AI 生成或后端 API。剧情由内置的确定性生成器合成，数据保存在浏览器 `localStorage`。

## 运行

无需安装依赖、无需构建。建议在项目根目录启动静态服务器：

```bash
cd code/frontend
python -m http.server 5173
```

浏览器访问：<http://localhost:5173>

也可以直接双击 `index.html`，但使用本地服务器更接近真实部署环境，也能避免未来的模块化 / fetch 请求受 `file://` 限制。

## 目录结构

```text
code/frontend/
├── index.html                  # 页面骨架、站点头尾与脚本入口
├── css/
│   └── app.css                 # 全部视觉样式与响应式规则
└── js/
    ├── data.js                 # 内置题材包、示例故事、演示作品
    ├── story-generator.js      # 本地确定性故事生成器
    └── app.js                  # 状态、路由、页面渲染与交互
```

脚本按 `data.js → story-generator.js → app.js` 的顺序加载，都是普通脚本（非 ES Module），因此不需要构建工具。

## 本地数据

原型使用以下 `localStorage` 键：

| 键 | 内容 |
|---|---|
| `echoquest.userGames.v1` | 用户创建的故事 |
| `echoquest.overrides.v1` | 节点等人工编辑覆盖 |
| `echoquest.draft.v1` | 创作页草稿 |
| `echoquest.saves.v1` | 手动存档 |
| `echoquest.autosave.v1` | 自动存档 |
| `echoquest.endings.v1` | 已解锁结局 |

头像区域是原型体验账号，不涉及真实注册。

## 后续接入后端的位置

| 能力 | 当前实现 | 接入建议 |
|---|---|---|
| AI 生成整局 | `js/app.js` 的 `startGeneration()` + `js/story-generator.js` | 新增 `js/api.js`，由后端生成故事树后替换本地生成结果 |
| 实时续写 | `renderPlay()` / 自由行动提交逻辑 | 提交当前节点、属性和选择，由后端返回下一个节点 |
| 登录注册 | 无，页头为静态体验账号 | 增加登录/注册页或弹窗，建立会话后再加载用户数据 |
| 作品与存档 | `readStore()` / `writeStore()` + `STORE_KEYS` | 用后端接口替换读写层，保留本地回退 |
| 分享 | 前端生成分享链接 | 改为后端短链或作品公开页 |

建议接入时新增 `js/api.js` 统一封装请求、鉴权和错误处理，不要把 `fetch` 分散到渲染函数里。

## 开发约定

- 保持无构建步骤，新增脚本继续使用普通 `<script>` 并在 `index.html` 中按依赖顺序引入。
- 文案与数据分离：题材、模板、示例内容放在 `data.js`，生成逻辑放在 `story-generator.js`。
- 所有由 AI 或用户生成的文本在插入 DOM 前继续使用现有 `escapeHtml()`，避免 XSS。
- 修改样式时优先补充 `app.css` 末尾的响应式规则，不要破坏现有断点。
- Google Fonts 仅在联网时生效，离线会自动回退到系统中文字体。
