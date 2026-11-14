# EchoQuest 测试

## 目录

- `unit/`：纯函数与校验逻辑，离线运行
- `integration/`：真实 HTTP handler + mock LLM
- `agent_demo_user_test/`：面向用户的 Agent Demo 冒烟测试记录

## 运行

```powershell
python -m unittest discover -s tests -v
```

预期：

```text
Ran 22 tests
OK
```

## 说明

这些测试是 Python unittest，不依赖 Node、Vitest 或 Playwright。
原始 `test-case.md` 中描述的 Vitest/Playwright/SQLite 测试工程并未包含在当前仓库中。
