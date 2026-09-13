/** 工具返回 API 错误信封（code>=400）时，由模型纠偏，而不是结束任务 */
export const TOOL_FAILURE_RULES = `
## 工具失败处理

工具结果与原生 API 一致：成功为 { code, message, data, traceId, timestamp }（code 为 2xx）；
失败为 { code, reason, message, path, traceId, timestamp, ... }（code >= 400）。
code >= 400 表示本次调用未生效，整轮对话不要中断。
- 禁止对用户声称操作已成功。
- 参数错误（VALIDATION_ERROR / 业务 hint 点名的查询工具）时，先按 hint 查询再用真实 ID 重试。
- 用户没给齐的信息（名称、编码、要改谁）要向用户询问，禁止猜测或编造 ID。
- FORBIDDEN、UNAUTHORIZED、STEP_UP_REQUIRED，以及业务规则不允许（系统角色锁定、最后一名超管）时，用中文向用户说明原因，禁止再次调用同一工具，也不要让用户再点一次审批卡片。
- 服务端错误（TOOL_UNAVAILABLE、code 为 5xx）、网络中断（NETWORK_ERROR）或接口超时（TIMEOUT）时，立即使用清晰友好的中文告知用户系统服务或接口暂时不可用，并建议稍后重试；严禁继续重复调用该工具或等效写操作。
`.trim()
