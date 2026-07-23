# OpenAPI 与 Codegen

> 相关：[契约与事件](../architecture/contracts-and-events.md) · [Phase 0](../implementation/roadmap.md)

## 流水线

```text
apps/api 启动（Swagger 开启）
  → SwaggerModule.createDocument(include = OPENAPI_MODULES)
  → 写入 apps/api/swagger.json
  → apps/agent: pnpm openapi:generate（@hey-api/openapi-ts）
  → apps/agent/src/api-client/（gitignored）
```

## 全量覆盖规则

1. OpenAPI **不再使用 `include` 白名单**，对 AppModule 已注册的全部控制器建档。
2. 新增业务 Module 时：加入 `AppModule.imports`，并同步更新 [`OPENAPI_REQUIRED_MODULE_NAMES`](../../apps/api/src/swagger/openapi-modules.ts)。
3. 单元测试 `openapi-modules.spec.ts` 校验清单与 `app.module.ts` 文本同步。
4. `swagger.json` **提交到仓库**，作为 Agent / 外部工具的契约输入；API 契约变更后应随 PR 更新该文件。
5. `apps/agent/src/api-client/` **不提交**，由 `predev` / `prebuild` 生成。

## 本地更新 swagger.json

```bash
# 启动 api（SWAGGER_ENABLED=true），启动时自动写出 swagger.json
pnpm -F api dev

# 或在临时脚本中调用 setupSwagger 后退出
```

更新后重新生成 Agent 客户端：

```bash
pnpm -F agent openapi:generate
```

## 响应追踪

- Body 字段：`traceId`
- 响应头：`x-trace-id`
- 兼容入站：`x-trace-id` 优先，其次 `x-request-id`
