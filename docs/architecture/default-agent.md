# Default Agent 运行基线

> 当前正式范围：默认 Chat 模式的 `default_agent`。Popup 模式使用 `agentId="plan"`，与本文档无关，不应被默认 Chat 的改动影响。

## 1. 运行链路

```text
Web Default Chat
  → CopilotKit Provider（Authorization: Bearer）
  → apps/api /copilot/*
  → CopilotRuntime
  → LangGraphAgent（default_agent）
  → apps/agent/src/default.ts
  → OpenAPI 生成 SDK
  → API Kernel（Auth / RBAC / DataScope / Audit）
  → 业务服务与 PostgreSQL
```

`apps/api/src/modules/copilot/copilot.controller.ts` 是鉴权后的 catch-all 入口。`CopilotService` 将请求中的 Bearer Token 放入 `assistantConfig.configurable`；Agent Tool 从 `RunnableConfig` 读取 Token，并通过 `executeApiCall` 在异步上下文中调用 OpenAPI SDK。业务权限仍由 API Controller 的 Guard 决定，Agent 不绕过 API 授权。

## 2. Default Agent 组成

入口是 `apps/agent/src/default.ts`，当前组合如下：

- Qwen OpenAI-compatible Chat Model，开启流式输出。
- `defaultAgentTools`：经唯一名称校验的内核 Tool 与生成的插件 Tool Registry。
- `copilotkitMiddleware`：连接 CopilotKit 与 LangGraph。
- `humanInTheLoopMiddleware`：高风险写 Tool 的强制审批与 resume。
- `summarizationMiddleware`：消息达到 24 条时压缩上下文并保留最近 8 条。
- Tool descriptor 执行策略：`executeApiCall` 按每个 Tool 的 timeout/retry/idempotency 元数据执行，仅对声明为可重试的只读请求做有限退避。
- `pluginToolVisibilityMiddleware`：模型调用前移除未启用插件 Tool，实际执行前再做一次启停校验。
- `modelCallLimitMiddleware`：限制单次 Run 的模型调用数。
- `toolErrorMiddleware`：把未捕获 Tool 异常转换为结构化失败结果。
- Prompt：身份、组织类型、失败处理、Generative UI、reasoning 风格规则。

## 3. 运行闭环契约

共享契约位于 `packages/shared/src/domains/copilot`。各概念的职责如下：

```text
Thread（一次连续对话）
  └─ Run（一次用户提交触发的完整执行）
      └─ Turn（一次输入到最终答复的业务轮次；当前与 Run 1:1）
          ├─ Message（system / user / assistant / tool）
          └─ ToolCall（参数与执行状态）
              └─ ToolResult（结构化成功或失败结果）
```

`Run` 与 `Turn` 暂时一一对应，但不合并概念：后续恢复、审批或子任务可能让一个 Run 跨越多个执行片段。`reasoning` 和 `activity` 是展示事件，不属于 `Message`，不得持久化后作为下一轮模型输入。

运行状态统一为 `pending / running / finishing / succeeded / failed / cancelled / timed_out / interrupted`；结束原因统一为 `completed / tool_error / model_error / validation_error / budget_exceeded / timeout / cancelled / disconnected / interrupted`。AG-UI 负责线上事件传输，PostgreSQL 持久化 Thread、Run、Turn、Message、Event、Checkpoint、Approval、ToolExecution、Memory、Evaluation 和 API 幂等结果。事件使用 Run 内单调递增 `sequence`，客户端通过 `after` 游标增量重放。

### 3.1 运行预算

Default Agent 使用 `DEFAULT_AGENT_RUN_BUDGET`，Popup 的 `plan_agent` 不使用该配置：

| 预算 | 当前值 | enforcement |
|---|---:|---|
| LangGraph 递归上限 | 25 | `assistantConfig.recursion_limit`，由远程 Graph 强制 |
| 单次模型调用最大输出 | 4096 tokens | Default Agent 专用 `ChatOpenAI.maxTokens` |
| 单次 Run 模型调用 | 16 | LangChain model-call middleware |
| 单次 Run 总 Token | 64000 | API 流事件累计，超限后 abort |
| 单次 Run 失败数 | 4 | Tool 结果累计，超限后 abort |
| 单次 Run 总时长 | 120 秒 | API Runtime 到期后调用 `abortRun()` 并结束流 |

Token 预算依赖模型 `on_chat_model_end` 事件中的 `usage/usage_metadata`。网关返回 usage 时每次模型调用只在 model-end 累计一次，避免与末尾 stream chunk 重复计费；网关不返回 usage 时仍由单次输出上限、模型调用数和总时长作为保护。

Default Agent 的远程流与单个 HTTP/浏览器订阅解耦。浏览器刷新或断开时，API 仍在当前实例内排空远程事件流，持续写入 Run、Event 和 Checkpoint；Web 重连后从 PostgreSQL 按 `sequence` 游标重放缺失事件。只有用户显式取消、预算超限或超时才调用 `abortRun()`。若 API 实例本身崩溃，运行由 PostgreSQL Lease 对账为超时，用户再从最新 Checkpoint 创建新 Run；当前不保证在无独立 Worker 时跨 API 进程崩溃原地继执。

取消或超时只终止后续 Agent 执行，不是数据库事务回滚。已经由 API 成功提交的写操作仍然有效，因此不能把“取消”展示成“撤销”。Tool 将 `runId/toolCallId` 作为幂等键传给 API；API 按 `tenantId + userId + key + request hash` 去重成功写请求。幂等不替代业务事务、权限或审计。

### 3.2 事件顺序

共享事件统一携带 `runId / turnId / sequence / createdAt`。Tool 调用的规范顺序是：

```text
tool.call.started
  → tool.call.args
  → tool.call.finished
  → tool.call.result
```

当前 AG-UI 对应 `TOOL_CALL_START → TOOL_CALL_ARGS → TOOL_CALL_END → TOOL_CALL_RESULT`。Runtime 在模型结束或 Tool 开始时补发前三个缺失事件，并按 `toolCallId` 去重；多个 Tool Call 按模型返回数组顺序发送，不交错同一 Tool Call 的 start/args/end。

## 4. Tool 清单与当前边界

权限以 API Controller 上的 `@RequirePermission` 为准；Tool 通过 OpenAPI SDK 调用。高风险 Tool 由 `humanInTheLoopMiddleware` 在执行前中断，Web 使用 CopilotKit v2 `useInterrupt` 展示参数并提交批准或拒绝；审批记录包含 actor、时间、参数 SHA-256 与过期时间。同一次 interrupt 包含多个 `actionRequests` 时，界面把它们作为一个审批批次展示，用户一次性全部批准或全部拒绝，不支持只批准其中一项。

### 用户管理

| Tool | API / 权限 | 类型 | 副作用 | 审批现状 | UI | 失败处理 |
|---|---|---|---|---|---|---|
| `query_users_list` | `GET /user` · `system:user:list` | 只读 | 无 | 不需要 | 用户表格 | SDK/API 错误 + 参数提示 |
| `query_user_detail` | `GET /user/:id` · `system:user:list` | 只读 | 无 | 不需要 | 默认结果 | 结构化失败 |
| `create_user` | `POST /user` · `system:user:create` | 写入 | 有 | 未强制 | 默认结果 | 角色/组织/岗位 hint |
| `update_user_info` | `PATCH /user/:id` · `system:user:update` | 写入 | 有 | 未强制 | 默认结果 | 结构化失败 |
| `restore_deleted_users` | `PATCH /user/restore` · `system:user:update` | 写入 | 有 | 未强制 | 默认结果 | `USER_NOT_DELETED` 等 hint |
| `update_user_status` | `PATCH /user/status` · `system:user:status` | 写入 | 有 | 未强制 | 默认结果 | 结构化失败 |
| `unlock_user` | `POST /user/:id/unlock` · `system:user:update` | 写入 | 有 | 未强制 | 默认结果 | 结构化失败 |
| `reset_user_password` | `POST /user/:id/reset-password` · `system:user:update` | 写入 | 有 | 强制审批 | 默认结果 | 结构化失败 |
| `revoke_user_sessions` | `POST /user/:id/revoke-sessions` · `system:user:update` | 写入 | 有 | 强制审批 | 默认结果 | 结构化失败 |
| `assign_user_roles` | `PATCH /user/:id/roles` · `system:role:assign` | 写入 | 有 | 强制审批 | 默认结果 | 角色 ID hint |
| `replace_user_organizations` | `PATCH /user/:id/organizations` · `system:org:update` | 高风险写入 | 有 | 强制审批 | 默认结果 | 组织/岗位 hint |
| `delete_users` | `DELETE /user` · `system:user:delete` | 高风险写入 | 有 | 强制审批 | 默认结果 | 结构化失败 |
| `hard_delete_users` | `DELETE /user/hard` · `system:user:delete` | 不可逆写入 | 有 | 强制审批 | 默认结果 | 结构化失败 |

### 角色与权限

| Tool | API / 权限 | 类型 | 副作用 | 审批现状 | UI | 失败处理 |
|---|---|---|---|---|---|---|
| `query_roles_list`, `query_role_detail`, `query_permissions_list`, `query_role_members` | `/role*` · `system:role:list` | 只读 | 无 | 不需要 | 默认结果 | 结构化失败 |
| `create_role`, `clone_role` | `/role*` · `system:role:create` | 写入 | 有 | 未强制 | 默认结果 | 业务 hint |
| `update_role_info`, `assign_role_permissions`, `assign_role_data_scope` | `/role*` · `system:role:update` | 高风险写入 | 有 | 权限/数据范围强制审批 | 默认结果 | 权限目录/版本 hint |
| `add_role_members`, `remove_role_member` | `/role/:id/members*` · `system:role:assign` | 写入 | 有 | 未强制 | 默认结果 | 成员/角色 hint |
| `delete_roles` | `DELETE /role` · `system:role:delete` | 高风险写入 | 有 | 强制审批 | 默认结果 | 业务 hint |

角色 Tool 统一使用 `executeApiCall` / `executeApiCallOrRecover`；已知角色、权限和成员冲突会返回业务 hint，未知异常转换为 `TOOL_CALL_FAILED`。

### 组织架构

| Tool | API / 权限 | 类型 | 副作用 | 审批现状 | UI | 失败处理 |
|---|---|---|---|---|---|---|
| `query_organization_tree`, `query_organization_detail`, `query_organization_members`, `query_organization_activities` | `/organizations*` · `system:org:list` | 只读 | 无 | 不需要 | 默认结果 | 结构化失败 |
| `query_organization_type_catalog` | `GET /organizations/type-catalog` · 仅认证 | 只读 | 无 | 不需要 | 默认结果 | 结构化失败 |
| `query_organization_positions` | `GET /organizations/:id/positions` · `system:post:list` | 只读 | 无 | 不需要 | 默认结果 | 结构化失败 |
| `create_organization` | `POST /organizations` · `system:org:create` | 写入 | 有 | 未强制 | 默认结果 | 组织类型 hint |
| `update_organization_type_catalog`, `update_organization_info`, `update_organization_leader`, `add_organization_member` | `/organizations*` · `system:org:update` | 写入 | 有 | 未强制 | 默认结果 | 组织类型/层级 hint |
| `change_organization_parent`, `remove_organization_member` | `/organizations*` · `system:org:update` | 高风险写入 | 有 | 强制审批 | 默认结果 | 组织层级/成员 hint |
| `create_organization_position`, `update_organization_position` | `/organizations/:id/positions*` · `system:post:manage` | 写入 | 有 | 未强制 | 默认结果 | 编制/在岗人数 hint |
| `remove_organization_position` | `DELETE /organizations/:id/positions/:positionId` · `system:post:manage` | 高风险写入 | 有 | 强制审批 | 默认结果 | 编制/在岗人数 hint |

组织 Tool 对组织树、类型目录和岗位编制使用 `/organizations/*` API；组织类型、岗位编制和层级调整的业务约束通过 `RecoverableHint` 返回 Agent。组织类型目录查询本身由 API 的当前认证上下文保护，修改接口由 `system:org:update` 保护。

### 岗位目录

| Tool | API / 权限 | 类型 | 副作用 | 审批现状 | UI | 失败处理 |
|---|---|---|---|---|---|---|
| `query_job_profiles_list`, `query_job_profile_detail` | `GET /post*` · `system:post:list` | 只读 | 无 | 不需要 | 岗位表格 / 默认结果 | 结构化失败 |
| `create_job_profile`, `update_job_profile_info` | `POST/PATCH /post*` · `system:post:manage` | 写入 | 有 | 未强制 | 默认结果 | 编码/状态 hint |
| `delete_job_profile` | `DELETE /post/:id` · `system:post:manage` | 高风险写入 | 有 | 强制审批 | 默认结果 | 关联编制 hint |

岗位 Tool 使用 `/post` API；编码冲突、岗位已使用、岗位已停用等场景返回明确业务 hint。所有写 Tool 统一通过结构化结果回传，高风险项在 API 调用前审批。

### Web 前端 Tool

以下 Tool 不属于 `default_agent` 的后端 Tool 注册，属于 CopilotKit 前端能力：

| Tool | 注册位置 | 作用 |
|---|---|---|
| `appearance` | `AgentSharedRegistrations` | 修改外观设置 |
| `navigate_to_page` | `PopupChatRegistrations` | Popup 专属导航能力 |
| `query_route_info` | `PopupChatRegistrations` | Popup 专属路由查询 |
| `query_users_list`, `query_job_profiles_list` | 默认 Chat Generative UI | 渲染查询结果表格 |
| `load_model`, `query_properties`, `highlight_elements`, `indoor_walkthrough` | BIM Copilot 注册项 | BIM 页面交互 |

Popup 专属注册项不得被默认 Chat 的运行时改动；默认 Chat 只消费其自己的 `ChatRegistrations` 和共享注册项。

## 5. 流事件处理

`apps/api/src/modules/copilot/langgraph-runtime-agent.ts` 负责 CopilotKit 与 LangGraph 事件之间的适配：

- 解析 Qwen `reasoning_content` 并转换为 reasoning 事件。
- 纯 reasoning chunk 不转发为助手正文。
- 模型结束或工具开始时补发缺失的 Tool Call start/args/end 事件。
- 对已经发出的 `toolCallId` 去重。
- 过滤 `reasoning` 和 `activity` 消息，避免它们进入下一轮 LangGraph 输入。

当前安装的 CopilotKit/LangGraph 组合仍以 `CUSTOM name="on_interrupt"` 传递 HITL，而不是标准 `RUN_FINISHED.outcome.interrupt`。Default Agent 适配器只为该 legacy 事件补充内部 `__zenInterruptId`，供审批落库和 Web 决策关联；继续执行仍使用 CopilotKit 当前的 `command.resume` 流程。Popup/`plan_agent` 的事件不经过此转换，保持原行为。升级依赖后应先用回归测试确认标准 interrupt 已可用，再移除兼容字段。

Web 使用 `tool-display.ts` 将函数名转换为业务文案，将内部查询隐藏在活动提示中，将结果型 Tool 交给专用 UI 渲染。

## 6. 结构化 Tool 失败

`executeApiCall` 不把业务/API 错误直接抛出给整个 Run，而是返回 JSON：

```json
{
  "success": false,
  "reason": "TOOL_CALL_FAILED",
  "message": "错误原因以及下一步建议"
}
```

已知业务冲突通过 `RecoverableHint` 提供明确下一步，例如先查询有效角色、组织或岗位 ID。未捕获异常由 `toolErrorMiddleware` 统一转换，并带上 Tool 名称。

## 7. 持久化、恢复与记忆

`apps/api/src/modules/copilot/default-agent-runtime.store.ts` 是 Default Agent 的运行时存储边界：

- `AgentEvent` 只记录可重放的规范 AG-UI 事件和 Run 内 sequence；`RAW` 事件及规范事件中的 `rawEvent` 不落库，避免持久化供应商内部元数据。`GET /copilot/runtime/runs/:runId/events?after=N` 支持游标重放。
- `AgentMessage` 只允许 system/user/assistant/tool，reasoning/activity 只保留在事件表。
- `AgentCheckpoint` 保存消息或 state snapshot；历史加载使用规范 Message，并用事件补齐断线前的助手增量。
- `AgentToolExecution` 保存参数、结果、尝试次数和幂等键；只读 Tool 可重试，写 Tool 不自动重试。
- 长期记忆默认只存储、不发送给模型。只有 `sensitivity=non_sensitive`、`shareWithModel=true`、`modelProvider=qwen` 且记录了批准时间的记忆会注入，最大 6000 字符。
- 上下文摘要是线程内短期记忆，不等于长期记忆；摘要和最近消息由 LangChain middleware 管理。

模型 token usage 只从 `RAW` 事件解析并累计到 Run，不从其衍生的规范事件重复统计；RAW 本身不会进入事件重放或下一轮模型输入。

## 8. 可观测、评测与运维

- `GET /copilot/runtime/metrics`：近 24 小时 Run/Tool 状态、总耗时与首 Token 延迟的 p50/p95、真实 usage 事件可用时的 token 汇总、审批和评测均值。
- `POST /copilot/runtime/runs/:runId/evaluations`：按 evaluator + metric 幂等写入 0..1 的人工或离线评测。
- `POST /copilot/runtime/maintenance/reconcile`：把超过 Run 预算仍未结束的记录标为 timeout，过期审批标为 expired，清理当前用户过期幂等记录。
- 日志和业务审计仍走平台 Logger/Audit；运行事件 payload 不作为下一轮模型输入。

不默认引入 Redis、队列或独立 Worker。当前 PostgreSQL + 进程内流适用于模块化单体部署；只有出现跨进程长任务、事件吞吐或恢复延迟指标超标时再引入异步基础设施。

## 9. Web 交互

- 左侧历史抽屉支持新建、切换、归档和二次确认删除。
- 切换会话时恢复消息并重放最新 Run 事件；显示“已恢复”状态。
- 输入草稿按 Thread 保存在浏览器本地；断网时禁用新发送，已开始的 Run 在 API 实例内继续排空和持久化，重连后按游标恢复。
- 顶部显示离线、运行中和恢复状态；输入区保留停止与重试能力。
- 高风险 Tool 使用可访问的 AlertDialog 展示 Tool 名称与参数，明确已提交副作用不会自动回滚。
- 运行记录抽屉支持状态筛选、Tool 时间线、审批记录、Artifact 懒加载、取消和恢复。
- 恢复先从 PostgreSQL 读取最新规范消息与 Checkpoint，再创建新 Run；不会将已终止的远程 Run 伪装成原 ID 继续。

## 9.1 插件 Tool

`@zen/plugin-sdk` 生成 `PLUGIN_AGENT_TOOL_FACTORIES`，Agent 宿主向工厂注入 Tool 构建器和 OpenAPI operation 调用器。插件不获得 Prisma/Repository；认证、RBAC、DataScope、错误分类、幂等与 Artifact 统一由宿主处理。API 每次请求查询当前租户 ACTIVE 插件 ID 并写入 `assistantConfig.configurable.activeAgentPlugins`；停用插件后，新模型请求不再看到对应 Tool，历史持久化结果仍可查看。

## 10. 边界检查

根命令 `pnpm run check:default-agent` 检查：

1. 默认 Chat 未绑定 Popup 的 `plan` Agent。
2. Popup 仍保持 `agentId="plan"`。
3. `default.ts` 通过 Registry 注册 Tool，并启用审批、压缩、插件过滤、模型调用预算和错误 Middleware。
4. 后端 Tool 文件通过 `../api` / `executeApiCall` 访问业务 API。
5. Agent Tool 目录没有 Repository 或 `@/modules/*` 直连。
6. Copilot Runtime 过滤 `reasoning/activity`。
7. 废弃 Chat 模块已标记，新增模块不得引用其内部实现。
8. Tool 请求必须传递用户隔离的 API 幂等键。
9. Default Runtime 必须持久化事件，Web 必须注册 interrupt 审批 UI。

该检查允许现有的 AppModule、模块导出清单和 Swagger 覆盖清单继续保留 `ChatModule` 兼容引用。
