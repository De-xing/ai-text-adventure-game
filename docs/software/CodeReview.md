# EchoQuest 代码质量报告

> 项目：EchoQuest 回响 · v1.3
> 扫描对象：`server.py`（Agent API、校验、密钥隔离和限流核心）
> 工具：Pylint 4.1.3 + Radon 6.0.1
> 日期：2026-11-07
> 结论：Pylint **8.98 → 10.00**，Code Smell **46 → 0**，最大圈复杂度 **62 → 17**，回归测试 **22/22 通过**。

---

## 1. 静态分析工具配置

### 1.1 工具选择

选择 **Pylint** 作为主静态分析工具，原因：

- 项目后端是 Python，Pylint 可直接分析 Agent 服务。
- 同时覆盖缺陷（E/F）、代码异味（W/C/R）和重复代码（R0801）。
- 配合 **Radon** 统计圈复杂度和可维护性指数。

### 1.2 配置文件

新增 [`.pylintrc`](../.pylintrc)，保留默认消息集，只关闭环境相关的 `import-error` 和 `no-member`。

### 1.3 扫描脚本

新增 [`qa/run_scan.py`](run_scan.py)：

- 运行 Pylint JSON/文本报告
- 运行 Pylint duplicate-code
- 运行 Radon CC / MI
- 生成 `metrics.json`

### 1.4 指标口径

| 指标 | 口径 |
|---|---|
| Bug 数 | Pylint `E`（error）+ `F`（fatal） |
| Code Smell 数 | Pylint `W`（warning）+ `C`（convention）+ `R`（refactor） |
| 圈复杂度 | Radon cyclomatic complexity，按函数/方法统计 |
| 重复率 | Pylint `duplicate-code`（R0801） |

---

## 2. 扫描结果

### 2.1 重构前

| 指标 | 数值 |
|---|---:|
| Pylint Score | **8.98 / 10** |
| Bugs（E+F） | **0** |
| Code Smells（W/C/R） | **46** |
| 平均圈复杂度 | **8.0** |
| 最大圈复杂度 | **62**（`validate_bible`） |
| 重复代码块 | **0** |
| 重复率 | **0.0%** |

主要问题分布：

| Message ID | 数量 | 说明 |
|---|---:|---|
| C0116 | 18 | 缺少函数/方法 docstring |
| C0209 | 10 | 可使用 f-string |
| R0914 | 3 | 局部变量过多 |
| C0115 | 2 | 缺少类 docstring |
| R0912 | 2 | 分支过多 |
| R0915 | 2 | 语句过多 |
| W0718 | 2 | 捕获过宽的 Exception |
| C0103 | 2 | `do_GET` / `do_POST` 命名不符合 snake_case |
| R0911 | 1 | return 过多 |
| W0613 | 1 | 未使用参数 `ending_count` |
| R1732 | 1 | 资源未使用 `with` |
| C0301 | 1 | 单行过长 |
| W0221 | 1 | `log_message` 签名告警 |

### 2.2 重构后

| 指标 | 数值 | 变化 |
|---|---:|---:|
| Pylint Score | **10.00 / 10** | **+1.02** |
| Bugs（E+F） | **0** | 持平 |
| Code Smells | **0** | **-46（-100%）** |
| 平均圈复杂度 | **4.51** | **-43.6%** |
| 最大圈复杂度 | **17** | **-72.6%** |
| 重复代码块 | **0** | 持平 |
| 重复率 | **0.0%** | 持平 |

> 说明：Bug 数为 0 表示 Pylint 未发现 E/F 级静态缺陷，不代表运行时绝对没有 bug。重构后仍保留 HTTP 集成测试来覆盖真实请求路径。

### 2.3 扫描报告截图

**重构前：**

![重构前 Pylint 扫描](screenshots/scan-before.png)

**重构后：**

![重构后 Pylint 扫描](screenshots/scan-after.png)

**质量报告总览：**

![质量报告总览](screenshots/quality-report.png)

---

## 3. Top 5 严重问题与重构

Top 5 的选择依据：圈复杂度极高、Pylint Refactor 告警集中、异常处理影响可观测性、参数/资源管理存在实际风险。

| # | 问题 | 重构前 CC | 重构后 CC | 处理方式 |
|---|---|---:|---:|---|
| 1 | `validate_bible` 巨型校验函数 | 62 | 8 | 拆成字段校验、节点收集、选项校验、结局校验、可达性、角色、分支等 8 个函数 |
| 2 | `normalize_plan_order` 图排序复杂 | 27 | 11 | 拆出 `_plan_graph` 与 `_topological_order` |
| 3 | `do_POST` API 入口过大 | 17 | 7 | 路由表 + 三个 handler + `ai_slot` 上下文管理器 |
| 4 | `call_llm` 局部变量多、异常捕获过宽 | 14 | 6 | 拆出 payload、请求、错误解析；引入 `UpstreamError` |
| 5 | `validate_nodes` 复杂且带未使用参数 | 20 | 7 | 拆出 `_written_node_issues`，移除 `ending_count` |

### 3.1 `validate_bible`

原实现同时处理字段存在性、节点数量、选项数量、边方向、可达性、结局数量、结局类型和角色数量，复杂度 62，是最大的维护风险。

重构后：

- `_missing_field_issues`
- `_collect_positions`
- `_choice_issue`
- `_non_ending_issues`
- `_ending_issues`
- `_validate_choices_and_endings`
- `_validate_reachability`
- `_validate_endings`
- `_validate_branching`
- `_validate_characters`
- `validate_bible` 只负责编排

对应测试覆盖：

- 合法蓝图无问题
- 非法 `startNodeId`
- 结局数量不符
- 选项指向前面节点
- 存在不可达节点

### 3.2 `normalize_plan_order`

拆分为：

- `_plan_graph`：构建 ID、索引、邻接表、入度
- `_topological_order`：稳定拓扑排序

保留原有行为：有环时不强行重排，避免破坏故事内容。

### 3.3 `do_POST`

重构前所有端点逻辑、限流、并发、读取 JSON、模型调用和异常处理都堆在一个方法中。

重构后：

- `AGENT_ROUTES` 路由表
- `_handle_architect`
- `_handle_write`
- `_handle_repair`
- `_story_context` 共享请求校验
- `_result_meta` 统一响应元数据
- `ai_slot` 上下文管理器负责信号量释放

HTTP 集成测试覆盖：

- `/api/health`
- `/api/agent/architect`
- `/api/agent/write`
- 非法 Origin 返回 403

### 3.4 `call_llm`

拆分为：

- `_llm_endpoint`
- `_llm_payload`
- `_request_llm`
- `call_llm` 只保留两次尝试的重试策略

异常策略：

- `UpstreamError` 携带 `retryable`
- 429/5xx/超时按原逻辑重试一次
- 不再捕获所有 `Exception`
- 日志和响应会移除 API Key

### 3.5 `validate_nodes`

- 移除未使用参数 `ending_count`
- 提取 `_written_node_issues`
- 保持错误文案和校验行为不变

---

## 4. 测试验证

### 4.1 测试策略

重构前先添加 **19 个回归测试**，覆盖：

- JSON 解析（裸 JSON、代码围栏、尾逗号、非法 JSON）
- 拓扑排序（重排、环）
- 故事严重性判断
- 蓝图校验（合法、起点缺失、结局数、反向边、不可达）
- 正文校验（合法、缺节点、选项数量、空文本）
- 文本截断

重构后新增 **3 个 HTTP 集成测试**：

- 健康检查
- 架构 + 撰写路由（mock LLM）
- 非法 Origin 拒绝

### 4.2 最终结果

```text
Ran 22 tests in 0.577s
OK
```

测试文件：

- [`qa/tests/test_server.py`](tests/test_server.py)
- [`qa/tests/test_http.py`](tests/test_http.py)

测试日志：[`qa/after/tests.txt`](after/tests.txt)

---

## 5. 指标对比

| 指标 | 重构前 | 重构后 | 变化 |
|---|---:|---:|---:|
| Pylint Score | 8.98 | 10.00 | +1.02 |
| Bugs（E/F） | 0 | 0 | 持平 |
| Code Smells | 46 | 0 | -100% |
| 平均圈复杂度 | 8.0 | 4.51 | -43.6% |
| 最大圈复杂度 | 62 | 17 | -72.6% |
| 重复代码块 | 0 | 0 | 持平 |
| 重复率 | 0.0% | 0.0% | 持平 |
| 回归测试 | 19 通过 | 22 通过 | +3 |

---

## 6. 残余风险与后续建议

1. **前端未纳入扫描**：`assets/*.js` 没有 Pylint 覆盖，建议下一步接入 ESLint（需要 Node.js）。
2. **重复率口径有限**：当前仅单模块 Pylint R0801，跨模块重复需要在完整仓库上扫描。
3. **静态分析不等于运行时质量**：建议补充真实模型调用的契约测试和前端 E2E。
4. **最大复杂度仍在 `_plan_graph`（17）**：可继续拆分为“解析边”和“初始化图”两个函数，但不属于阻断问题。
5. **Pylint 10 分不代表零缺陷**：仍需关注 429、超时、JSON 截断和模型输出漂移。
6. **前端测试缺失**：建议后续加入 Playwright 覆盖“生成 → 工坊 → 游玩”主链路。

---

## 7. 复现方式

```powershell
# 安装工具
python -m pip install -r qa/requirements-qa.txt --target .qa-tools

# 扫描
python qa/run_scan.py baseline
python qa/run_scan.py after

# 测试
python -m unittest discover -s qa/tests -v

# 重新生成报告
python qa/build_report.py
```

原始数据：

- [`qa/baseline/metrics.json`](baseline/metrics.json)
- [`qa/after/metrics.json`](after/metrics.json)
- [`qa/baseline/pylint.txt`](baseline/pylint.txt)
- [`qa/after/pylint.txt`](after/pylint.txt)
- [`qa/baseline/radon-cc.json`](baseline/radon-cc.json)
- [`qa/after/radon-cc.json`](after/radon-cc.json)
