# Zen

Monorepo 平台（Web + API + Agent），业务能力以**第一方编译期插件**扩展。

> 详细设计见 [docs/architecture/plugin-system.md](docs/architecture/plugin-system.md) · [ADR-001](docs/adr/001-plugin-runtime-model.md)

## 插件模型（一句话）

插件与平台同仓、同版本构建；启停靠 `plugin_installations` + 注册表过滤实现**逻辑停用**，不是热插拔。Schema / Migration 集中在 `apps/api/prisma`。

```text
plugins/<id>/zen.plugin.json
        ↓  validate / generate
packages/plugin-sdk/.../plugin-registry.gen.ts
        ↓  宿主挂载
apps/api  PluginsModule + PluginActiveGuard
apps/web  薄路由 + Vite alias + 菜单过滤
```

## 仓库布局

| 路径 | 职责 |
|------|------|
| `plugins/*` | 能力插件（`@zen/plugin-<id>`） |
| `packages/plugin-sdk` | Manifest 契约、发现/校验、注册表生成、贡献点工具 |
| `apps/api` | Nest 内核 + `PluginsModule` 聚合 + 插件管理 API |
| `apps/web` | Shell：薄路由挂载、菜单/`pluginId` 过滤、系统「插件管理」页 |
| `docs/` | 架构、脚手架指南、参考插件设计 |

当前已落地插件：`demo-notes`、`notifications`、`files`、`jobs`（`hello-stub` 仅 Manifest 骨架）。

---

## 命令

```bash
# 脚手架
pnpm plugin:create <id> "显示名"

# 校验 plugins/*（依赖 DAG、权限码冲突、Manifest）
pnpm plugin:validate

# 生成 packages/plugin-sdk/src/generated/plugin-registry.gen.ts
pnpm plugin:generate
```

---

## 创建插件（最短路径）

1. `pnpm plugin:create my-feature "我的功能"`
2. 填写 `plugins/my-feature/zen.plugin.json`（权限、`routes`、`apiModule` 等）
3. 实现 `src/api`（Nest `DynamicModule`）与 `src/web`（页面）
4. 需要持久化时：在 `apps/api/prisma/schema.prisma` 增加模型 + migration + 权限种子
5. `pnpm plugin:validate` → `pnpm plugin:generate`
6. **宿主挂载**（见下文）
7. `pnpm -F api check-types` / `pnpm -F web check-types`

参考实现：[`plugins/demo-notes`](plugins/demo-notes)、[`plugins/notifications`](plugins/notifications)、[`plugins/files`](plugins/files)、[`plugins/jobs`](plugins/jobs)。

更完整的步骤说明：[docs/guides/create-plugin.md](docs/guides/create-plugin.md)。

---

## Manifest（`zen.plugin.json`）

```json
{
  "id": "demo-notes",
  "name": "演示便签",
  "version": "0.1.0",
  "platformVersion": "^0.1.0",
  "dependsOn": [],
  "contributions": {
    "permissions": [
      {
        "code": "demo:note:list",
        "name": "查看便签列表",
        "module": "demo"
      }
    ],
    "routes": "./src/web/routes",
    "apiModule": "./src/api/demo-notes.module",
    "configSchema": "./src/config.schema.ts",
    "events": ["demo.note.created"],
    "agentTools": "./src/agent/tools.ts"
  },
  "lifecycle": {
    "activate": "./src/activate.ts",
    "deactivate": "./src/deactivate.ts"
  }
}
```

| 字段 | 说明 |
|------|------|
| `id` | kebab-case，与包名 `@zen/plugin-<id>` 一致 |
| `dependsOn` | 插件依赖 DAG；循环依赖校验失败 |
| `contributions.permissions` | 权限码格式 `module:resource:action`，全局唯一 |
| `contributions.apiModule` | Nest Module 入口 |
| `contributions.routes` | Web 路由贡献声明（实际挂载由宿主薄路由完成） |
| `contributions.configSchema` | 插件配置 Zod schema |
| `lifecycle.*` | 启停钩子（无破坏性；停用不删数据） |

包目录约定：

```text
plugins/<id>/
  package.json              # @zen/plugin-<id>，exports: ., ./api, ./web
  zen.plugin.json
  src/
    activate.ts / deactivate.ts
    api/                    # Nest Module、controller、service、repository
    web/                    # 页面与 routes 元数据
    agent/                  # 可选 Tool
    config.schema.ts        # 可选
  tests/
```

依赖约束：插件只依赖 `@zen/plugin-sdk`、`@zen/shared`、`@zen/ui`（前端）与公开平台 API；**禁止** `import` 其他插件 `src/**`。

---

## 宿主集成

### 1. API：聚合 Nest Module

在 [`apps/api/src/plugins.module.ts`](apps/api/src/plugins.module.ts) 引入插件的 `XxxModule.forRootAsync`，由 `AppModule` 导入 `PluginsModule`：

```ts
@Module({
  imports: [
    PrismaModule,
    DemoNotesModule.forRootAsync({
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({ prisma })
    })
    // …其他插件
  ]
})
export class PluginsModule {}
```

插件 Controller 须：

- `@RequirePermission(...)` — 权限门禁
- `@RequirePlugin(PLUGIN_ID)` — 停用后由 `PluginActiveGuard` 返回 **404**
- 列表查询走 `applyDataScope`（有组织归属时）

### 2. API：插件管理

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/plugins` | `plugin:list` | 列出注册表 + 安装状态 |
| GET | `/plugins/active-ids` | 登录即可 | 前端菜单/路由过滤 |
| POST | `/plugins/:id/activate` | `plugin:manage` | 启用 |
| POST | `/plugins/:id/deactivate` | `plugin:manage` | 停用 |
| PATCH | `/plugins/:id/config` | `plugin:manage` | 更新配置 Json |

状态存于 `plugin_installations`（按租户）。管理 UI：系统 → 插件管理。

### 3. Web：薄路由 + 启停守卫

插件页面不直接改 Shell 核心，而是：

1. 在 `apps/web/src/routes/_authenticated/...` 增加薄路由
2. `beforeLoad` 调 `fetchActivePluginIds()`，未启用则重定向 403
3. `staticData.pluginId` 供侧栏按启用状态过滤

```ts
export const Route = createFileRoute('/_authenticated/demo/notes')({
  beforeLoad: async () => {
    const ids = await fetchActivePluginIds()
    if (!ids.includes('demo-notes')) {
      throw redirect({ to: '/errors/403', replace: true })
    }
  },
  component: DemoNotesPage,
  staticData: {
    title: '演示便签',
    group: '演示',
    order: 100,
    permissions: ['demo:note:list'],
    pluginId: 'demo-notes'
  }
})
```

feature 容器再 re-export 插件包页面，例如：

```ts
import { NotesPage } from '@zen/plugin-demo-notes/web'
```

### 4. Web：Vite alias

开发态直接解析插件源码（见 [`apps/web/vite.config.ts`](apps/web/vite.config.ts)）：

```ts
alias: {
  '@zen/plugin-demo-notes/web': path.resolve(monorepoRoot, 'plugins/demo-notes/src/web/index.ts'),
  // 新插件按同样模式追加
}
```

并确保 `server.fs.allow` 包含 monorepo 根。

### 5. 数据库

- 插件模型**合并进** `apps/api/prisma/schema.prisma`
- Migration / 权限种子由平台统一执行
- 停用保留数据；卸载**不**自动回滚表结构

---

## 运行时行为

| 状态 | 菜单/路由 | API | 数据 |
|------|-----------|-----|------|
| `ACTIVE` | 可见（仍受权限过滤） | 可用 | 可读写 |
| `INACTIVE` / 未安装 | 侧栏隐藏；路由 beforeLoad → 403 | `@RequirePlugin` → 404 | 保留 |

SDK 侧可用：

```ts
import {
  PLUGIN_REGISTRY,
  ContributionRegistry,
  filterActiveRegistryEntries
} from '@zen/plugin-sdk'
```

---

## 安全清单（插件作者）

1. API 必须挂权限装饰器；禁止裸暴露
2. Agent Tool 经 HTTP/OpenAPI 调业务 API，禁止直连 Repository
3. 配置走 Zod schema，拒绝非法键
4. 启停写审计（平台 `PluginService` 已覆盖管理操作）

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [docs/architecture/plugin-system.md](docs/architecture/plugin-system.md) | 架构基线：贡献点、生命周期、DB 策略 |
| [docs/adr/001-plugin-runtime-model.md](docs/adr/001-plugin-runtime-model.md) | 编译期优先决策 |
| [docs/guides/create-plugin.md](docs/guides/create-plugin.md) | 创建指南（最短路径） |
| [docs/implementation/plugin-reference.md](docs/implementation/plugin-reference.md) | `demo-notes` 参考设计 |
| [packages/plugin-sdk/README.md](packages/plugin-sdk/README.md) | SDK 校验/生成命令 |
