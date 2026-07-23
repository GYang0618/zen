# 创建能力插件

最短路径（编译期插件）：

1. `pnpm plugin:create <id> "显示名"`
2. 填写 `plugins/<id>/zen.plugin.json`（权限、routes、apiModule）
3. 实现 `src/api`（Nest DynamicModule）与 `src/web`（页面）
4. 如需持久化：在 `apps/api/prisma/schema.prisma` 增加模型 + migration + 权限种子
5. `pnpm plugin:validate` → `pnpm plugin:generate`
6. 宿主挂载：
   - API：`apps/api/src/plugins.module.ts` 引入 `XxxModule.forRootAsync`
   - Web：薄路由 `apps/web/src/routes/_authenticated/...` + Vite alias（如需 `/web` 源码导出）
7. `pnpm -F api check-types` / `pnpm -F web check-types`

参考实现：`plugins/demo-notes`、`plugins/notifications`、`plugins/files`、`plugins/jobs`。
