# Default Agent 运维手册

## 日常检查

1. 查看 `GET /copilot/runtime/metrics`，关注 failed/timed_out Run、失败 Tool、总耗时/首 Token p95 与 pending approvals。
2. 运行 `POST /copilot/runtime/maintenance/reconcile`，对账超时 Run、过期审批和幂等记录。
3. 按 `runId` 查询 `GET /copilot/runtime/runs/:runId/events?after=0`，使用 sequence 定位事件缺口。
4. 业务写入以 API AuditLog 为准；Agent Run 取消不代表业务回滚。

## 故障处理

| 现象 | 检查 | 处理 |
|---|---|---|
| Run 长期 running | Run.leaseExpiresAt、lastHeartbeatAt、LangGraph 可用性、最后事件 | 执行 reconcile；用户从运行记录恢复为新 Run |
| 浏览器断开后无新事件 | API 实例日志、Run.leaseExpiresAt、LangGraph 远程 Run | 确认 API 进程未重启；当前断线继执依赖发起该 Run 的 API 实例持续存活，进程失效后执行 reconcile 并从 Checkpoint 恢复为新 Run |
| Tool 重复提交 | `x-agent-idempotency-key`、AgentIdempotencyRecord | 相同请求重放成功结果；不同请求复用键返回 409 |
| 审批无法继续 | Approval 过期时间、legacy `on_interrupt` 中的 `__zenInterruptId`、Web 是否在线 | 过期后重新发起；不得直接执行高风险 Tool；同批 actionRequests 只能整批批准或拒绝 |
| 历史缺少正文 | Message snapshot 与 TEXT_MESSAGE 事件 | 从 sequence=0 重放最新 Run，检查事件落库错误 |
| Token 指标为空 | RAW 模型事件是否携带 usage/usage_metadata | 不估算为真实用量；确认 Qwen 网关 usage 配置；RAW 只计量、不落 Event 表 |
| 插件 Tool 不可见 | PluginInstallation.status、租户 ID、`activeAgentPlugins` | 在插件管理中启用；不得绕过 API Guard 直连数据库 |

## 数据保留

- 幂等结果默认保留 24 小时，由 reconcile 清理。
- 审批默认 15 分钟过期。
- Memory 可设置 expiresAt；默认 private 且不发送模型。
- Event/Checkpoint 当前随 Thread 删除。生产环境应按合规要求配置定期归档任务后再调整保留期。

## 扩容触发条件

仅在以下指标持续出现时评估 Redis/队列/Worker：单机流连接耗尽、跨实例 Run 所有权冲突、事件写入 p95 超过交互预算、或需要在 API 进程崩溃后仍原地继执。引入后仍保持 PostgreSQL 为最终状态与审计来源。
