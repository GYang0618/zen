# 契约与事件（Contracts & Events）

> 状态：设计基线  
> 相关：[插件系统](./plugin-system.md) · [领域与安全](./domain-and-security.md) · [平台总览](./platform-overview.md)

## 1. 契约策略总览

Zen 以 **Zod + TypeScript + OpenAPI** 作为跨端契约三角：

| 层 | 真相源 | 消费方 |
|----|--------|--------|
| 领域 Schema | `@zen/shared`（Zod） | web、api、agent、插件 |
| HTTP API | NestJS + Swagger → `swagger.json` | web 客户端、agent codegen |
| 插件 Manifest | `@zen/plugin-sdk` 类型 + JSON Schema | CI 校验器、脚手架 |

规则：

1. 跨端 DTO **禁止**只在某一 app 内私有定义后复制。
2. 所有对外 HTTP API **必须**进入 OpenAPI（AppModule 注册即入档；用 `OPENAPI_REQUIRED_MODULE_NAMES` 门禁防漏）。
3. Breaking change：shared major + OpenAPI diff 门禁失败则阻断合并。

## 2. 权限码命名

```text
{domain}:{resource}:{action}
```

| 段 | 规则 | 示例 |
|----|------|------|
| domain | 插件 id 或 `system` / `platform` | `system`、`demo` |
| resource | 单数名词 kebab 可，推荐短词 | `user`、`note` |
| action | 动词：`list` `get` `create` `update` `delete` `export` `manage` … | `list` |

示例：

- `system:user:list`
- `system:role:assign-permissions`
- `demo:note:create`

约束：

- 全小写、冒号分隔、三段式（扩展动作用连字符放在 action）。
- 插件权限 `domain` 必须等于 Manifest `id` 或其声明的 alias（需在 Manifest 显式列出）。
- 种子权限与 Guard / 前端 meta / Tool 注解使用**同一字符串常量**（从 `@zen/shared` 导出）。

## 3. API 约定

### 3.1 响应包络

与现有风格对齐（示意）：

```ts
type ApiSuccess<T> = {
  code: number
  message: string
  data: T
  traceId: string
}

type ApiError = {
  code: number
  message: string
  errors?: unknown
  traceId: string
}
```

- 业务错误用明确 code；校验失败返回字段级 `errors`。
- `traceId` 响应头与 body 双写（至少一处强制）。

### 3.2 分页

统一 `@zen/shared` 分页 query / response；插件不得自创分页字段名。

### 3.3 空值语义

- 前端优先 `undefined`；「明确空」用 `null`。
- 后端接口协议以 `null` 表达空；未传参不出现在 JSON 中。

### 3.4 OpenAPI 流水线

```text
api boot / generate
  → swagger.json
  → openapi-ts（agent / 可选 web）
  → 契约测试：snapshot / breaking check
```

## 4. 事件模型

### 4.1 第一阶段：进程内事件总线

技术建议：NestJS `EventEmitter2`（或等价），封装为 `PlatformEventBus`。

**事件命名**：

```text
{domain}.{entity}.{verb}
```

示例：

- `platform.plugin.activated`
- `platform.permission.changed`
- `system.user.created`
- `demo.note.created`

### 4.2 Envelope

```ts
type PlatformEvent<T> = {
  id: string          // ULID/UUID
  type: string        // 事件名
  tenantId: string
  occurredAt: string  // ISO
  actorId?: string
  traceId?: string
  payload: T
  version: 1
}
```

强制：`tenantId` 必填；跨租户广播禁止。

### 4.3 平台标准事件

| 事件 | 用途 |
|------|------|
| `platform.plugin.activated` / `deactivated` | 刷新菜单缓存、Tool 注册 |
| `platform.permission.changed` | 权限缓存 / permVer |
| `platform.session.revoked` | 多端登出协同 |
| `system.user.updated` | 资料变更通知 |

### 4.4 演进：Outbox / 跨进程

触发条件（满足再做，见 roadmap Phase 5）：

- API 多实例且需可靠投递
- 插件任务需跨进程消费

届时引入：

1. 同事务 Outbox 表
2. Relay → Redis Streams / NATS
3. 消费者幂等键：`event.id`

第一阶段**不实现**分布式总线，但 Envelope 字段预留兼容。

## 5. 幂等与可靠性

| 场景 | 策略 |
|------|------|
| 写 API 防重复 | Idempotency-Key 头（可选，P1） |
| 事件处理 | 按 `event.id` 去重表 |
| Webhook 出站 | 签名 + 指数退避重试（插件） |
| 任务 | 状态机 + 唯一 job key |

## 6. 可观测性

| 信号 | 要求 |
|------|------|
| Logs | JSON；含 `traceId` `tenantId` `userId` `pluginId?` |
| Traces | 至少 HTTP → service 跨度；Agent tool 调用跨度 |
| Metrics | 请求量、延迟、4xx/5xx、插件 activate 失败次数 |
| Audit | 安全关键路径独立存储，不与 debug 日志混用 |

## 7. 契约测试门禁

CI 最少包含：

1. `shared` 类型检查与 schema 单测
2. OpenAPI 生成成功且全模块覆盖检查
3. Manifest 校验（权限码、依赖 DAG）
4. （Phase 3+）参考插件 e2e：有权限 / 无权限

## 8. 验收要点

- [ ] 新增 API 未进 Swagger 时 CI 失败
- [ ] 权限码常量跨端引用，无魔法字符串散落（抽查）
- [ ] 领域事件带 tenantId；监听方可按租户过滤
- [ ] 日志可按 traceId 串联一次用户操作
