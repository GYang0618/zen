# Zen `default_agent` Chat 分阶段任务规划

> 2026-08-30 实施状态：本文保留原始分阶段目标作为验收基线。当前代码已补齐 Tool descriptor 策略、Run/Event/Checkpoint/Approval/Artifact 持久化与 API、租户插件 Tool 装载/过滤、运行预算、Run 历史/恢复/取消、审批摘要和 Artifact 懒加载。浏览器断开后 API 会继续排空当前远程流并持久化事件；显式取消、超时和预算超限才终止运行。恢复的实际语义是“从 PostgreSQL 最新 Checkpoint 准备上下文，再创建新 Run”；无独立 Worker 时不保证 API 进程崩溃后原地继执。

## 范围说明

本规划只覆盖“默认模式 Chat”：

```text
apps/web Copilot Chat
  → CopilotKit 默认 Agent
  → apps/api/src/modules/copilot
  → apps/agent/src/default.ts
  → OpenAPI SDK
  → API Kernel / 业务插件
```

明确区分两种模式：

| 模式           | Agent            | 本规划         |
| -------------- | ---------------- | -------------- |
| 默认 Chat 模式 | `default_agent`  | 覆盖           |
| Popup 模式     | `agentId="plan"` | 不修改、不规划 |

因此：

- 不修改 `apps/web/src/features/ai/copilot/popup.tsx`。
- 不改变 Popup 的 Agent ID、注册逻辑和交互行为。
- 不规划 `plan_agent`。
- `apps/api/src/modules/chat` 仍视为废弃模块，不新增功能。
- Web 交互设计只针对默认 Chat 页面及其专属注册项。

---

# 一、当前已完成能力

## Default Agent

- `apps/agent/src/default.ts` 已接入业务 Tool。
- 已支持用户、角色、组织、岗位等 API Tool。
- Tool 通过 OpenAPI SDK 调用 API。
- 已有 Access Token 透传。
- 已有结构化 Tool 失败结果。
- 已有 `toolErrorMiddleware`。
- 已有 Qwen reasoning 内容处理。
- 已有 reasoning 文案业务化和工具名清洗。
- 已有 LangGraph Tool Call 补发和去重。
- 已有工具参数校验和业务恢复提示。

## 默认 Chat Web

- 默认 Chat 页面。
- CopilotKit `useAgent` 交互。
- 流式消息展示。
- reasoning/activity 展示。
- Tool Call 分组。
- 专用查询结果 UI。
- Tool 状态卡片。
- Tool 活动指示器。
- 失败重试。
- 取消当前运行。
- 鉴权失效自动刷新。
- 自适应多行输入。
- 动态欢迎语和占位符。
- 相关单元测试。

## 本次实现与剩余项

本次已补齐上述 Run/Turn/Tool Execution、Checkpoint、事件游标、断线排空、审批、Artifact、Tool descriptor、插件 Agent Tool、Run 历史/恢复/取消、长对话摘要、首 Token 和总耗时指标。

以下项仍是后续生产化工作，不应被当作已完成：

- Phase 7 的成本金额预算、Tool 熔断、模型降级、告警通知和离线评测数据集。当前已有运行指标与评测记录 API，但没有自动计费及告警策略。
- 跨 API 进程或进程崩溃后的原地后台继执。当前以 PostgreSQL Lease 标记过期并从 Checkpoint 创建新 Run，完整后台执行需独立 Worker/队列。
- 插件 `toolUi` 的通用动态加载。当前已生成 Manifest 元数据和 Agent Tool loader，`demo-notes` 参考 Tool 使用通用 Tool UI。
- “重试当前 Tool”和“编辑原消息后重发”的专用交互。当前已支持整轮 Run 重试/恢复，以及失败后保留输入。

---

# 二、Default Agent 阶段规划

## 阶段 0：默认 Chat 基线收敛

### 任务

- 固定 `/copilot/*` 为默认 Chat 的正式 API 入口。
- 固定 `apps/agent/src/default.ts` 为默认 Agent Graph。
- 梳理默认 Chat 当前可用 Tool。
- 统一 Tool 名称、权限码、错误码和业务文案。
- 明确默认 Chat 专属的 Web Tool 注册项。
- 标记 `chat` 模块为 deprecated。
- 保持 Popup/`plan_agent` 独立，不纳入本阶段改动。

### 交付物

- Default Agent Tool 清单。
- Tool 与 API、权限、UI 映射表。
- 默认 Chat 与 Popup 的边界说明。
- Chat 模块废弃说明。

### 验收标准

- 默认 Chat 的能力均可追溯到 `default_agent`。
- Popup 现有行为不受影响。
- 新功能不会进入废弃 Chat 模块。

---

## 阶段 1：Default Agent 运行闭环

### 任务

统一以下运行对象和状态：

```text
Run
Turn
Message
ToolCall
ToolResult
```

```text
queued
running
waiting-tool
waiting-approval
completed
failed
cancelled
```

完善：

- 文本流式输出。
- 连续 Tool 调用。
- Tool 结果驱动后续模型调用。
- 最大步骤数、Token、时间和失败次数预算。
- 明确 Run 结束原因。
- reasoning/activity 只用于展示，不回传给模型。
- 统一文本、Tool、Activity 和错误事件。

### 验收标准

- 默认 Chat 可以完成普通问答。
- 可以连续调用多个 Tool。
- Tool 结果不会丢失或重复。
- 达到预算后安全结束。
- 后续轮次不会因 reasoning/activity 产生运行错误。

---

## 阶段 2：Tool 治理与错误处理

### 任务

为每个 Tool 补充：

```text
inputSchema
permissionCode
riskLevel
sideEffect
requiresApproval
timeout
retryPolicy
idempotencyPolicy
```

统一执行流程：

```text
Schema
  → Access Token
  → Tenant Context
  → RBAC
  → DataScope
  → API 调用
  → 结果标准化
  → 审计
```

统一错误分类：

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
BUSINESS_ERROR
NETWORK_ERROR
RATE_LIMITED
TIMEOUT
TOOL_UNAVAILABLE
UNKNOWN_ERROR
```

规则：

- 参数错误交给 Agent 纠正。
- 权限错误不自动重试。
- 网络和限流错误有限重试。
- 副作用状态不明确时先查询再重试。
- 写操作使用 `runId + toolCallId` 幂等。
- 大型结果保存为 Artifact，仅返回摘要。

### 验收标准

- Tool 无法绕过 API 权限和 DataScope。
- 错误可以被 Agent 理解并采取下一步动作。
- 重复 Tool Call 不产生重复副作用。
- Tool 执行可被审计。

---

## 阶段 3：审批与用户控制

### 任务

默认需要审批的操作：

- 删除和彻底删除。
- 批量写操作。
- 权限和角色修改。
- 强制下线。
- 外部网络写操作。
- 其他不可逆操作。

审批信息包含：

```text
approvalId
runId
toolCallId
operation
targetSummary
impactSummary
riskLevel
parameterSummary
status
expiresAt
```

支持：

```text
approve
reject
reject-with-reason
cancel
expire
```

### 验收标准

- 高风险 Tool 执行前必须审批。
- 批准后只执行一次。
- 拒绝、过期或取消不会产生副作用。
- 审批结果能够继续驱动默认 Agent。
- 审批状态不会依赖浏览器内存。

---

## 阶段 4：持久化、中断与恢复

### 任务

- 将生产 Checkpoint 持久化到 PostgreSQL。
- 持久化 Run、Event、Checkpoint、Tool Execution、Approval 和 Artifact。
- 使用稳定的 `runId`、`threadId` 和事件序号。
- 页面断开不自动终止 Run。
- 默认 Chat 重连时按事件游标补齐事件。
- 支持取消和恢复 Run。
- 使用 Lease、Heartbeat 和过期回收避免重复执行。
- 使用 Abort Signal 终止模型和可取消 Tool。
- 服务重启后从最近有效 Checkpoint 恢复。

### 计划提供的能力

```text
查询 Run
查询增量事件
取消 Run
恢复 Run
提交审批
查看 Artifact
```

### 验收标准

- 刷新或关闭默认 Chat 页面后任务不丢失。
- 重连不会重复展示消息和 Tool。
- Agent 服务重启后 Run 可以恢复。
- 用户取消后最终状态为 `cancelled`。
- 工具状态不明确时不会盲目重复执行。

---

## 阶段 5：上下文与长对话

### 任务

上下文统一包含：

```text
系统指令
当前用户请求
最近消息
历史摘要
当前页面上下文
任务状态
关键实体 ID
Tool 结果摘要
用户偏好
```

- 监控上下文 Token。
- 接近限制时自动摘要。
- 摘要保留目标、关键实体、失败原因和下一步。
- 区分会话记忆和长期偏好。
- 按用户和租户隔离记忆。
- 敏感信息默认不进入长期记忆。
- 支持用户补充条件后继续任务。
- 增加步骤、Token、时间和失败次数预算。

### 验收标准

- 长对话不会超过上下文限制。
- 压缩后仍能继续执行任务。
- Tool 大结果不会挤占主要上下文。
- 用户追加条件后后续 Tool 使用新条件。

---

## 阶段 6：插件化 Default Agent

### 任务

扩展插件贡献点：

```text
agentTools
toolUi
agentPrompts
requiredPermissions
```

- 由 `@zen/plugin-sdk` 生成默认 Agent Tool 注册表。
- 只有 ACTIVE 插件的 Tool 才对默认 Agent 可见。
- 插件 Tool 必须通过 API/OpenAPI 调用业务能力。
- 插件 Tool 复用平台权限、DataScope、错误和审计。
- 将 `demo-notes` Tool 占位实现升级为可执行参考。
- 插件停用后移除 Tool 和 Tool UI 注册。
- 历史 Run 仍能展示已保存结果。
- 不新增独立 Agent Graph。

### 验收标准

- Manifest 和权限冲突会被 CI 拒绝。
- 停用插件后默认 Agent 不再看到对应 Tool。
- 插件 Tool 不能绕过 API 权限。
- 插件 Tool UI 遵循统一状态协议。

---

## 阶段 7：生产治理

### 任务

- 建立 Run、Model Call、Tool Call、API Request、Approval、Checkpoint Trace。
- 记录首 Token 延迟、总耗时、Token、Tool 成功率、Run 完成率和取消率。
- 建立默认 Chat 的离线评测集：
  - Tool 选择
  - 参数生成
  - 权限拒绝
  - 业务错误恢复
  - 审批
  - 取消和恢复
  - 长上下文
  - Prompt Injection
- 管理模型、Prompt、Tool 和 Schema 版本。
- 增加成本预算、Tool 熔断、模型降级和告警。
- 仅在多实例或长任务达到阈值后引入 Redis、队列和独立 Worker。

---

# 三、默认 Chat Web 交互体验部门

## 范围

仅覆盖：

```text
apps/web/src/features/ai/copilot/chat.tsx
apps/web/src/features/ai/copilot/components/*
apps/web/src/features/ai/copilot/generative-ui/*
apps/web/src/components/ai/*
packages/ui/src/components/ai-elements/*
```

不覆盖：

- `apps/web/src/features/ai/copilot/popup.tsx`
- Popup 的 `agentId="plan"`。
- Popup 专属注册和布局。
- `plan_agent` 相关体验。

---

## Web 阶段 W0：默认 Chat 状态机

### 任务

统一前端状态：

```text
idle
composing
submitting
streaming
tool-running
waiting-approval
reconnecting
stopping
completed
failed
cancelled
```

- 使用 `eventId`、`toolCallId` 和 `sequence` 去重。
- 保留失败 Run 中已展示的用户消息。
- reasoning/activity 只展示，不重新发给 Agent。
- 将 Tool、Activity、Approval 和消息状态统一映射到组件。

### 验收标准

- 默认 Chat 任意时刻都有明确状态。
- 等待审批不会显示为失败。
- 重复事件不会产生重复消息。

---

## Web 阶段 W1：当前聊天体验增强

### 任务

在已有能力上继续完善：

- 多行输入和草稿保留。
- 流式输出期间保持可交互。
- 底部自动跟随和回到底部按钮。
- Markdown、代码、表格和链接统一渲染。
- 桌面侧栏、主聊天页和移动端适配。
- 失败后支持：
  - 重试当前 Run
  - 编辑原消息
  - 重新发送
- 保留默认 Chat 当前的动态欢迎语和停止按钮。

### 验收标准

- 首个流式事件到达后立即显示反馈。
- 长文本不会明显卡顿。
- 移动端输入区域不遮挡消息。
- 失败后用户输入不会丢失。

---

## Web 阶段 W2：Tool UI 标准化

### 任务

统一 Tool Card：

```text
工具业务名称
操作摘要
当前状态
参数摘要
执行耗时
结果摘要
详情展开
恢复操作
```

- 默认展示业务语义，不显示底层函数名。
- 查询 Tool 使用专用结果 UI。
- 连续 Tool 调用按实际顺序分组。
- 大型结果、日志和 Artifact 懒加载。
- 插件 Tool UI 使用同一状态协议。
- 保留当前 Tool 分组和专用结果渲染逻辑。

### 验收标准

- 用户无需阅读 JSON 即可理解结果。
- Tool 状态变化清晰。
- Tool UI 不造成布局抖动。
- 专用结果 UI 和默认 Tool UI 不重复渲染。

---

## Web 阶段 W3：审批、取消和错误恢复

### 任务

审批卡片展示：

```text
操作名称
操作对象
影响范围
风险等级
关键参数
执行原因
批准
拒绝
取消 Run
```

恢复入口：

```text
重试当前 Tool
继续当前 Run
重新执行当前消息
编辑后重新发送
取消 Run
```

- 权限错误不显示无效重试。
- 网络错误提供重试。
- 参数错误提供编辑入口。
- Tool 超时提供等待、重试或取消。
- 取消过程中显示“正在停止”。
- 审批状态刷新和重连后保持一致。

### 验收标准

- 用户无需阅读完整消息即可理解高风险操作。
- 审批不会重复提交。
- 断线后可继续处理审批。
- 用户可以区分 Tool 重试和整轮重跑。

---

## Web 阶段 W4：Run 历史和结果管理

### 任务

在 Run 持久化完成后增加：

- 默认 Chat Run 历史。
- 按运行中、待审批、完成、失败、取消筛选。
- Tool 调用时间线。
- 审批记录。
- Artifact 和完整结果。
- Run 恢复、取消、重试和归档。
- 从历史 Run 创建新任务。

### 验收标准

- 用户可以定位历史默认 Chat 任务。
- 待审批 Run 有明确入口。
- Tool 结果、Artifact 和最终答案可以互相定位。
- Popup 历史和行为不被改变。

---

## Web 阶段 W5：性能与可访问性

### 任务

- 对流式文本进行批量增量渲染。
- 大型 Tool 结果和日志懒加载。
- 必要时对长消息列表虚拟化。
- 支持键盘发送、停止、审批、拒绝和重试。
- 管理审批弹层焦点。
- 为状态图标提供可读文本。
- 支持暗色、高对比度和移动端。
- 避免动态内容造成布局持续跳动。

### 验收标准

- 长 Run 期间页面保持可交互。
- 键盘可以完成默认 Chat 核心流程。
- 屏幕阅读器可以识别消息来源和 Tool 状态。
- 桌面端和移动端不存在内容遮挡。

---

# 四、公共契约

## Run 状态

```text
queued
running
waiting-tool
waiting-approval
stopping
completed
failed
cancelled
expired
```

## Tool 状态

```text
pending
running
needs-approval
succeeded
failed
timed-out
denied
cancelled
```

## Event 字段

```text
eventId
runId
threadId
turnId
toolCallId?
sequence
type
status
payload
traceId
occurredAt
```

## Web 数据流

```text
Copilot/LangGraph Event
  → Event Adapter
  → Default Chat Run State
  → Message / Tool / Approval State
  → 通用或插件 Tool UI
```

---

# 五、测试计划

## Default Agent

- 默认 Chat 普通问答。
- 多轮对话。
- 连续 Tool 调用。
- Tool 参数纠错。
- RBAC、DataScope 和租户隔离。
- Tool 失败分类和恢复。
- 审批通过、拒绝、过期和重复提交。
- 用户取消。
- Checkpoint 恢复。
- 服务重启恢复。
- 上下文压缩。
- 插件 Tool 注册和停用。
- Prompt Injection 和越权请求。

## 默认 Chat Web

- 默认 Chat 发送和流式展示。
- reasoning/activity 展示和过滤。
- Tool Call 分组。
- 专用查询结果 UI。
- Tool 失败恢复。
- 审批通过和拒绝。
- 页面刷新和断线重连。
- 事件排序与去重。
- 长文本、长日志和 Artifact。
- 移动端输入。
- 键盘和可访问性操作。

## 明确不测试

- Popup 的 Agent ID 修改。
- Popup 切换到 `default_agent`。
- `plan_agent` 的新功能。
- 废弃 Chat 模块的新能力。

---

# 六、完成定义

- 默认 Chat 的正式链路全部使用 `default_agent`。
- Popup 保持 `agentId="plan"` 及现有独立行为。
- `plan_agent` 不参与本规划。
- `chat` 模块不再承载新 Agent 能力。
- Default Agent 具备稳定的消息、Tool、审批和最终回答闭环。
- Tool 统一经过权限、DataScope、租户隔离和审计。
- Tool 失败能够分类处理，避免危险重试。
- 默认 Chat 支持断线、取消、恢复和历史 Run。
- 长对话能够压缩上下文并保持任务目标。
- 插件可以贡献 Default Agent Tool 和 Tool UI。
- 默认 Chat 能清晰展示执行、审批、失败、取消和完成状态。
- 核心 Agent 和默认 Chat Web 流程都有自动化测试。

## 默认假设

- `apps/api/src/modules/copilot` 是正式 Copilot API 入口。
- `apps/agent/src/default.ts` 是本规划唯一 Agent Graph。
- `apps/web` 的默认 Chat 和 Popup 是两套不同产品模式。
- Popup 和 `plan_agent` 维持现状，不做迁移。
- `apps/api/src/modules/chat` 仅按废弃模块处理。
- 延续 CopilotKit、LangGraph、LangChain、OpenAPI SDK 和 Qwen 兼容模型。
- 首期使用 PostgreSQL 持久化，Redis、队列和独立 Worker 按规模触发。
- 本规划不绑定日历周期，以阶段依赖、交付物和验收标准推进。
