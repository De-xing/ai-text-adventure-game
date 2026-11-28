# EchoQuest 工具白名单

`tools/whitelist.json` 是后端的固定工具注册表，也是当前唯一的“工具调用白名单”。

它不是模型自主 Function Calling：模型没有工具选择权，只有白名单里登记的 HTTP 路由可以被 `POST` 调用。

## 文件结构

```json
{
  "version": 1,
  "tools": [
    {
      "name": "create_story_blueprint",
      "endpoint": "/api/agent/architect",
      "method": "POST",
      "handler": "_handle_architect",
      "mode": "llm",
      "scopes": ["story:write"]
    }
  ]
}
```

字段：

| 字段 | 说明 |
|---|---|
| `name` | 工具名，用于限流分桶和审计 |
| `endpoint` | 只允许 `/api/` 前缀，且不能重复 |
| `method` | 当前固定 POST |
| `handler` | 必须是以 `_handle_` 开头的方法 |
| `mode` | `llm`（调模型）或 `read`（只读检索） |
| `scopes` | 权限声明，当前用于展示和后续鉴权 |

## 运行时行为

1. `server.py` 启动时读取并校验 `tools/whitelist.json`。
2. 文件缺失、JSON 非法、字段缺失、endpoint/handler 重复或格式不合法时，服务直接启动失败，不静默放行。
3. `do_POST()` 只接受白名单内的 endpoint；未知路由返回 404。
4. 限流按 `name` 分桶，新增工具不会共用旧桶。
5. `GET /api/tools` 返回白名单的工具名、endpoint、mode 和 scopes，便于联调。

## 新增工具

1. 在 `server.py` 添加 `_handle_xxx` 方法。
2. 在 `tools/whitelist.json` 增加一条记录。
3. 跑测试并重启服务。

不允许把任意 URL、数据库写操作或 shell 命令注册成工具；白名单只解决“哪些固定能力可以被调用”，不解决“模型自主规划工具”。后者属于 Function Calling 演进阶段。
