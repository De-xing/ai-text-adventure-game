# EchoQuest QA

## 工具

- **Pylint 4.1.3**：缺陷、Code Smell、可维护性与重复代码
- **Radon 6.0.1**：圈复杂度、原始指标
- **unittest**：回归测试，不依赖额外测试框架

## 安装

```powershell
python -m pip install -r qa/requirements-qa.txt --target .qa-tools
```

## 运行扫描

```powershell
python qa/run_scan.py baseline
python qa/run_scan.py after
```

输出会写入 `qa/baseline/` 和 `qa/after/`：

- `pylint.json`：Pylint JSON 结果
- `pylint.txt`：Pylint 文本与评分
- `duplicate.json`：重复代码检查
- `radon-cc.json`：圈复杂度
- `radon-mi.json`：可维护性指数
- `metrics.json`：汇总指标

## 运行测试

```powershell
python -m unittest discover -s qa/tests -v
```

## 扫描口径

- 扫描对象：`server.py`（Agent API 与业务校验核心）。
- Pylint 分类映射：
  - **Bug**：`E`（error）+ `F`（fatal）
  - **Code Smell**：`W`（warning）+ `C`（convention）+ `R`（refactor）
- 重复代码：Pylint `duplicate-code`（R0801）。
- 复杂度：Radon cyclomatic complexity（CC）。
- 前端 `assets/*.js` 不在本轮 Pylint 扫描范围内；后续可单独接入 ESLint。

## 文件

- `quality-report.md`：质量报告
- `quality-report.html`：可截图/浏览的 HTML 报告
- `screenshots/`：扫描前后和报告截图
