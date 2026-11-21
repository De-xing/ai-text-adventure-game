# 截图与素材放这里

替换幻灯片里的三处虚线占位时，把图片拷进本目录，然后在 `slides.md` 里用相对路径引用：

```md
<img src="./images/pulse.png" style="height:96px" />
```

建议命名：

- `pulse.png` —— 仓库提交历史（第 22 页）
- `quality-report.png` —— 质量报告（第 52 页），可直接从 `qa/screenshots/quality-report.png` 拷过来
- `code-stats.png` —— 代码统计（第 53 页）

图片不要超过 2000px 宽，否则构建产物会很大。
