# EchoQuest Slidev 幻灯片

本目录是可直接放进 GitHub 仓库的 Slidev 幻灯片源码，配合根目录 `.github/workflows/deploy-slides.yml` 自动构建并发布到 GitHub Pages。

## 文件

```text
.github/workflows/deploy-slides.yml   GitHub Actions 构建/发布
docs/slides/
├── slides.md                         新版 38 页正文
├── package.json                      Slidev 依赖与脚本
├── images/                           本地图片（不依赖外链）
├── speech-script.md                  8 分钟讲稿 + 2 分钟演示
├── qa-prep.md                        答辩问答
├── rehearsal-notes.md                现场故障预案与检查清单
└── .gitignore
```

## 本地预览

需要 Node.js 20+：

```bash
cd docs/slides
npm install
npm run dev
```

浏览器打开 `http://localhost:3030`。

构建静态文件：

```bash
npm run build -- --base /<仓库名>/
npx serve dist
```

如果部署在用户主页仓库 `<user>.github.io`，`--base /`；如果是普通项目仓库，`--base /<仓库名>/`。Actions 会自动判断，不需要手工改。

## GitHub Pages 部署

1. 把本目录的 `.github/` 和 `docs/slides/` 放到仓库根目录。
2. 在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. push 到 `main`，或手动运行 **Actions → Deploy Slides → Run workflow**。
4. 部署完成后访问：

```text
https://<user>.github.io/<repo>/
```

用户主页仓库则是：

```text
https://<user>.github.io/
```

## 注意

- 不要提交 `node_modules/` 和 `dist/`；已在 `.gitignore` 排除。
- 图片都放在 `docs/slides/images/`，不要用外链图床；答辩现场断网也能显示。
- 没有 `package-lock.json` 时 workflow 会自动执行 `npm install`；有 lock 时用 `npm ci`。
- 如果仓库原来用分支发布 Pages，切换到 GitHub Actions 会替换线上页面；请先确认是否保留旧站点。
- 幻灯片不包含 API Key，也不需要任何服务端环境变量。
