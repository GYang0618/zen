# Agent

LangGraph / CopilotKit Agent 服务。用户相关 HTTP 调用通过 OpenAPI 生成的类型安全 SDK（`src/api-client`）访问后端。

## 前置条件

1. 启动 `apps/api` 并确保 `SWAGGER_ENABLED=true`，以生成/更新 `apps/api/swagger.json`
2. 在 `apps/agent` 安装依赖：`pnpm install`

## 生成 API 客户端（编译期）

```bash
pnpm run openapi:generate
```

`pnpm run build` / `pnpm run dev` 会通过 `prebuild` / `predev` 自动执行上述命令。

生成目录：`src/api-client/`（已 gitignore，勿手改）。业务代码从 `src/api` 导入：

环境变量 `API_BASE_URL`（默认 `http://127.0.0.1:3000`）作为 SDK `baseUrl`。

用户 JWT 链路：前端 `Authorization` → `api/copilot` Controller → `CopilotService` → `LangGraphAgent.assistantConfig.configurable.accessToken` → agent 工具从 `RunnableConfig` 读取。

## 用户管理工具（LangChain）

`src/tools/user.ts` 提供 8 个工具，与后端 `UserController` 一一对应，经 OpenAPI SDK 调用：

| 工具名 | 说明 |
|--------|------|
| `get_users` | 分页查询用户 |
| `create_user` | 创建用户 |
| `get_user` | 用户详情 |
| `update_user` | 更新用户 |
| `restore_users` | 批量恢复 |
| `update_users_status` | 批量改状态 |
| `delete_users` | 软删除 |
| `hard_delete_users` | 物理删除 |

已在 `src/default.ts` 的 `createAgent({ tools })` 中注册。

## 开发

```bash
pnpm run dev          # LangGraph CLI
pnpm run service      # Hono 服务（watch）
```

只跑根目录 `pnpm dev`。Ctrl+C 等到退出，不要叉终端。Copilot 连不上时：

```powershell
# 检查 3600 是否被占用（OwningProcess 即 PID）
Get-NetTCPConnection -LocalPort 3600 -ErrorAction SilentlyContinue | Select-Object State, OwningProcess

# 把上面的 OwningProcess 填进来，杀掉整棵进程树
taskkill /F /T /PID <OwningProcess>
```
