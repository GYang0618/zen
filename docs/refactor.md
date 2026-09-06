# Zen 全项目重构计划

## 总体目标

从当前 `main` 创建新分支 `codex/zen-platform-rewrite`，不继承其他半成品分支。采用分阶段、每阶段可运行的方式，保留现有业务能力，重写内部架构、接口、数据库和 Agent 协议。

目标包括：

- [x] NestJS 12 + 原生 ESM API。
- [x] CopilotKit v2 + AG‑UI。
- [x] 独立部署的 LangGraph Agent 服务。
- [x] LangChain/LangGraph 最新 1.x 编排、checkpoint、memory、HITL。
- [x] TanStack Router/Form/Table 全量规范化。
- [x] Radix UI 全量迁移到 Base UI。
- [x] Shared、plugin SDK、插件注册和工具契约统一重构。
- [x] 删除旧 Chat、旧 SDK、legacy interrupt 和兼容分支。

## 当前进度

阶段一至六的实现主体已完成。LangGraph `interrupt` 已从 RUN_ERROR 纠正为 HITL 事件；卡片列表已虚拟化。BIM / GIS 按产品要求暂不处理。

剩余主要是浏览器联机：全屏 Chat 批准 / 过期 / 取消 Run、带会话的 `/info`，以及用户 / 组织表单单测、演示便签写入。

2026-09-06 浏览器点选（`admin` 登录）：登录、表格搜索/批量、组织树、插件页、Copilot 弹窗流式、Agent 全屏页可进入。全屏 HITL 已复测：审批卡可点、切走再回来卡片恢复、拒绝后 Agent 说明已取消且 `wang.wu` 仍为 active。批准 / 过期 / 取消 Run 尚未联机。

## 阶段一：基线与工具链

- [x] 从 `main` 创建重构分支。
- [x] 记录 Web、API、Agent、UI、Shared、插件的 typecheck、build、test 基线。
- [x] 统一 pnpm lockfile、TypeScript、Biome、测试运行器和构建脚本。
- [x] 将 lint 改为只读检查，移除 `biome check --write` 作为验证命令。
- [x] API 与 Agent 测试改为原生 ESM 方案，移除 CJS loader、`ts-node/register`、`tsconfig-paths` 运行时依赖。

## 阶段二：Shared 与插件平台

重构 `packages/shared`：

- [x] 按 `contracts`、`domains`、`agent`、`security`、`errors`、`pagination`、`primitives` 组织目录。
- [x] 以 Zod schema 作为运行时契约唯一来源。
- [x] 统一 ID、错误码、分页、权限、审计和状态枚举。
- [x] 新增 `AgentRuntimeContext`、`AgentState`、`ToolManifest`、`ToolResult`、`AgentEvent`、`ApprovalRequest` 等类型。
- [x] 通过明确的 package exports 暴露公共接口，禁止跨包引用内部路径。

重构 plugin SDK：

- [x] manifest 统一声明工具 schema、权限、风险、审批、重试、幂等、UI 元数据和版本。
- [x] 启动时校验工具名称、权限、schema、策略和贡献点。
- [x] 更新所有插件的 NestJS 12 peer dependency 和新工具契约。
- [x] 保留编译期插件模型，但统一 API、Web、Agent 三侧注册方式。

## 阶段三：API 重写

### NestJS 与 ESM

- [x] 升级全部 NestJS 相关依赖到 v12。
- [x] `apps/api/package.json` 增加 `type: module`。
- [x] 使用 NodeNext；统一 `.js` 相对导入和可运行的 package exports。
- [x] 拆分 `infra`、`config`、`security`、`identity`、`organization`、`content`、`storage`、`plugin`、`agent` 模块。
- [x] 缩小全局模块范围，使用显式 provider token 和 constructor injection。
- [x] 增加 Prisma、Logger、Storage 的初始化、关闭和健康检查生命周期。
- [x] 统一 Zod 校验、异常过滤、序列化、trace 和错误响应。

### CopilotKit v2

- [x] 删除 `@copilotkit/sdk-js`、旧 LangGraph 继承适配器和所有 v1 API。
- [x] 统一使用 CopilotKit v2 runtime、AG‑UI 和 LangGraph HTTP Agent。
- [x] Runtime、Agent registry、handler 在 Nest 生命周期内单例初始化。
- [x] 不再每次请求动态创建 `CopilotRuntime`。
- [x] 使用明确的 v2 Express/Hono adapter，避免 Nest catch-all 直接转发原始 `req/res/next`。
- [x] 请求级注入认证、租户、插件快照、trace、预算和取消信号。
- [x] 删除 `on_interrupt`、`__zenInterruptId`、旧消息 role 过滤和自定义事件补发。

### Agent Runtime 服务

拆分现有巨型 `DefaultAgentRuntimeStore`：

- [x] Thread service/repository
- [x] Run service/repository
- [x] Event journal
- [x] Checkpoint projection
- [x] Approval/HITL service
- [x] Tool execution ledger
- [x] Memory service
- [x] Artifact service
- [x] Metrics service
- [x] Idempotency service
- [x] 删除 API 内旧 `ChatModule`、`MemorySaver` 和 `/chat` 执行链，统一使用独立 Agent 服务。

### 安全与运行控制

- [x] 统一 Bearer token 解析。
- [x] Copilot 路由使用独立限流、并发配额和 body size 配置。
- [x] SSE 不进入普通 JSON 幂等缓存。
- [x] 幂等只作用于明确命令型接口，使用数据库原子 reserve。
- [x] Step-up token 绑定 tenant、user、run、tool、approval 和 nonce，并单次消费。
- [x] 生产环境拒绝 wildcard CORS、占位数据库地址和默认敏感配置。
- [x] 增加 graceful shutdown、租约、孤儿 Run 对账和取消机制。

## 阶段四：Agent 重写

### 图与上下文

- [x] 保留 `default_agent` 和 `plan_agent` 图 ID。
- [x] 使用 LangChain/LangGraph 最新 1.x API。
- [x] 通过图工厂创建 Agent，禁止跨请求共享可变状态。
- [x] 统一 typed runtime context：
  - tenant/user/thread/run/trace
  - access token
  - locale
  - permissions
  - active plugins
  - memory policy
  - abort signal
  - model metadata

### Checkpoint 与 Memory

- [x] 使用官方 Postgres-backed LangGraph checkpointer。
- [x] 使用 LangGraph Store 或等价持久化 Store 管理长期记忆。
- [x] namespace 至少包含 tenant、user、scope；线程记忆额外包含 thread。
- [x] checkpoint 保存版本、父 checkpoint、namespace、metadata 和 hash。
- [x] API 数据库只保存查询投影、审计、审批、工具账本和 Artifact。
- [x] 敏感记忆默认不进入模型；只有用户授权、非敏感、未过期记忆可召回。
- [x] 增加 TTL、撤回、冲突处理、容量和 token 预算策略。

### 工具执行

- [x] 由统一 `ToolManifest` 生成工具、权限、风险、审批、重试、幂等和 UI 元数据。
- [x] 工具必须显式接收 `ToolExecutionContext`。
- [x] 缺少 run/tool/tenant/user 标识时，写操作 fail closed。
- [x] API client 改为每次运行创建无状态实例。
- [x] 大结果强制 Artifact 化并返回摘要引用。
- [x] 用 capability tags 替代关键词裁剪工具。

### HITL

- [x] 使用 LangGraph `interrupt()` 和 `Command({ resume })`。
- [x] 统一 `actionRequests`、decision、expiry、reason 和 approval 状态。
- [x] 审批、checkpoint、tool ledger 使用事务边界。
- [x] 前端使用 CopilotKit v2 `useInterrupt`（不使用 `useHumanInTheLoop`）。
- [x] 通过标准 AG‑UI interrupt 事件传递给 Web。
- [ ] 联机验证批准、过期、取消、重复提交（拒绝与断线恢复已复测）。

## 阶段五：UI 与 Web

### Base UI

按组件依赖顺序迁移：

- [x] Button、Label、Dialog、Popover
- [x] Select、Dropdown Menu、Tabs、Tooltip
- [x] Checkbox、Switch、Radio Group
- [x] Sheet、Scroll Area、Avatar、Progress 等
- [x] 同步修改 Web 和插件消费者，保留现有视觉 token 与交互语义。删除 `radix-ui`、`@radix-ui/*` 和 Radix icon 依赖；非 Radix 库保持不变。每个组件生成 `.migration/<component>.md` 报告。

### TanStack Router

- [x] 集中 route context，注入 QueryClient、认证状态和插件状态。
- [x] 所有 search 参数使用 Zod schema。
- [x] 统一 `loaderDeps`、`beforeLoad`、pending、error 和权限守卫。
- [x] 清理隐式类型转换、重复导航逻辑和全局路由状态。
- [x] 保持插件页面的启用检查和权限过滤。

### TanStack Form

全量替换 `react-hook-form`：

- [x] 使用 `@tanstack/react-form` 和 Zod validator。
- [x] 统一字段、错误、异步校验、提交状态、服务器错误和 reset。
- [x] 抽取共享 Field、FieldGroup、FormActions。
- [x] 迁移认证、用户、角色、组织、岗位、插件等全部表单。
- [x] 删除 `react-hook-form` 和相关 resolver 依赖。

### TanStack Table

- [x] 使用 `createColumnHelper`。
- [x] 保持稳定的 columns/data 引用。
- [x] 统一服务端分页、排序、过滤、选择和 URL 状态。
- [x] 抽取共享 DataTable primitives。
- [x] 统一 loading、empty、error、批量操作和键盘交互。

### React 与 CopilotKit

- [x] 所有 CopilotKit API 统一使用 `/v2`。
- [x] 使用 `useAgent`、`useFrontendTool`、`useAgentContext`、`useRenderTool`；LangGraph HITL 使用 `useInterrupt`（不使用 `useHumanInTheLoop`）。
- [x] 清理旧 hooks、旧聊天组件和 legacy event 处理。
- [x] 遵循 React 19、React Compiler、稳定引用、避免无意义 effect 和渲染瀑布规范。
- [x] BIM / GIS 页面 `React.lazy` + `Suspense` 代码分割。
- [x] 动态插件路由统一 `pendingComponent`。
- [x] 用户 / 角色 / 岗位卡片列表使用 `VirtualList` 虚拟化。
- [x] LangGraph `interrupt` 不再当作 RUN_ERROR：Runtime 转为 `INTERRUPT` + `RUN_FINISHED`，前端忽略该失败态。

## 阶段六：数据库迁移

- [x] 将 Agent 状态、风险、审批和运行原因改为 Prisma enum。
- [x] 拆分 checkpoint、事件、运行投影、审批、工具执行、记忆、Artifact 和幂等模型。
- [x] 增加 tenant/user/thread/run 复合索引和外键。
- [x] 编写可重复执行的数据迁移与校验脚本。
- [x] 将旧 interrupt 标记为历史记录，不再由运行时读取。
- [x] 删除废弃 Chat 表和 legacy 字段。

## 验收标准

### 静态检查

- [x] 不存在 `@copilotkit/sdk-js`、`runtime-client-gql`、v1 hooks、旧 LangGraph adapter。
- [x] 不存在 `on_interrupt`、`__zenInterruptId`。
- [x] 不存在 Radix import。
- [x] API 产物为 ESM，不包含 `require`。
- [x] 所有包通过只读 lint、typecheck、build。

### 运行与安全

- [x] CopilotKit v2 源码契约：Express adapter 暴露 `/info` 与 SSE，Default Agent 绑定 `default_agent`。
- [x] Copilot 弹窗可发送消息并完成流式回复（浏览器点选）。
- [x] 已登录 `/info` 经 CopilotKit 中间件交给 Express adapter，并返回 agents 清单（单测）。
- [x] AG‑UI 事件顺序通过 LangGraphAgent 真实 Observable 流断言（`RUN_STARTED` → 文本 → `RUN_FINISHED`）。
- [x] Checkpoint 按 `tenant:thread` namespace 读取最新投影，供跨进程恢复。
- [x] HITL 批准 / 拒绝 / 过期 / 幂等重试 / 取消 Run 服务单测通过；`interrupt` 不再写成失败。
- [x] 租户隔离、生产环境 CORS 拒绝 wildcard、Copilot 限流 429、step-up、幂等竞争单测通过。
- [x] Artifact 租户隔离、超时 / 孤儿 Run 对账单测通过。
- [ ] 浏览器带会话直连 CopilotKit `/info`。
- [ ] HITL 批准 / 过期 / 取消的浏览器联机验收（拒绝已复测）。
- [x] 断线重连的浏览器联机验收。

### Web/UI

- [x] Dialog、Tooltip、Select、Dropdown Menu、Popover 键盘聚焦单测通过。
- [x] Router search、认证守卫和插件守卫通过测试；浏览器确认登录跳转、search 写回 URL、插件页可进入。
- [x] 登录、岗位创建、插件 JSON 配置表单校验与提交单测通过。
- [x] DataTable 分页、排序、过滤、选择、URL 恢复和键盘选择通过测试；浏览器确认用户 / 角色 / 岗位列表主路径。
- [x] Agent Chat 全屏页可进入，弹窗流式消息可用；第二轮 `interrupt` 不再显示为请求失败。
- [ ] Agent Chat 全屏批准、过期、取消 Run 的浏览器联机验收（拒绝 / 重连已复测）。
- [ ] 用户 / 组织等其余表单提交单测。

### 已知环境问题（不阻塞架构勾选）

- BIM / GIS 静态资源代理暂不处理（按产品要求跳过）。
- 演示便签「新建」未出现在列表，需单独排查插件写路径。

## 剩余工作

1. 浏览器复测全屏 Agent Chat：审批、恢复、取消、重连。
2. 浏览器带会话请求 CopilotKit `/info`。
3. 补用户 / 组织等其余表单提交单测。
4. 排查演示便签新建不落库。

## 默认假设

- 只以当前 `main` 为基线。
- Agent 保持独立服务部署。
- CopilotKit 使用自托管 AG‑UI 和 LangGraph HTTP Agent。
- 数据库按新模型设计并提供迁移。
- 所有表单迁移到 TanStack Form。
- 旧内部 API、数据库结构、Agent 协议和 UI 组件接口不保证兼容。
- 每个阶段必须通过对应验证门禁后才进入下一阶段。
- LangGraph HITL 前端必须使用 CopilotKit v2 的 `useInterrupt`，不得改成 `useHumanInTheLoop`。
