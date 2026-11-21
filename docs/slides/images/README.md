# 截图与素材

`slides.md` 中的质量截图已改为本地引用，不再使用虚线占位：

| 文件 | 用途 |
|---|---|
| `quality-report.png` | 质量报告总览（Pylint / Radon / 测试） |
| `scan-before.png` | 重构前 Pylint 扫描截图 |
| `scan-after.png` | 重构后 Pylint 扫描截图 |
| `scan-compare.png` | 前后对比合成图，第 52 页使用 |

引用方式：

```md
<img src="./images/quality-report.png" style="height:170px" />
<img src="./images/scan-compare.png" style="height:170px" />
```

截图来自仓库 `qa/screenshots/`，如需更新，替换本目录同名文件即可。图片放在本地，现场断网也不会白屏。
