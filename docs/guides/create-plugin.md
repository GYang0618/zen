# 创建能力插件

最短路径（编译期插件 + 生成式宿主）：

1. `pnpm plugin:create <id> "显示名"`（默认 `--with-api --with-web`，并自动 `plugin:generate`）
2. 按需编辑 `plugins/<id>/zen.plugin.json`（Manifest v2：permissions / api / routes / config / lifecycle）
3. 实现业务：`src/api`（`forRootAsync` Module）与 `src/web`（Page + props.request/can）
4. 如需持久化：在 `apps/api/prisma/schema.prisma` 增加模型 + migration（集中式，不私有 migrate）
5. `pnpm plugin:validate` → `pnpm plugin:generate`（或 `pnpm plugin:check`）
6. **不要**手改 `PluginsModule`、Vite alias、薄路由；生成物会写入：
   - `apps/api/src/generated/plugin-*.gen.ts`
   - `apps/web/src/routes/_authenticated/plugins/*.tsx`
   - `packages/plugin-registry/src/generated/*`
7. `pnpm -F api check-types` / `pnpm -F web check-types`

参考实现：`plugins/demo-notes`、`plugins/notifications`、`plugins/files`、`plugins/jobs`。

## Manifest v2 要点

- `routes[].path` 必须为 `/plugins/<segment>`
- `routes[].icon` 必须是 SDK `ALLOWED_PLUGIN_ICONS` 中的 kebab-case key
- 菜单由 route `staticData` 单源派生，无独立 menus
- Nest 装饰器从 `@zen/plugin-sdk/nest` 引入（`RequirePlugin` / `RequirePermission` / `CurrentAuth` / `ZodValidationPipe`）
