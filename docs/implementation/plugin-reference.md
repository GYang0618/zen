# 参考插件设计（Plugin Reference）

> 状态：**已落地（Phase 3）**  
> 相关：[插件系统](../architecture/plugin-system.md) · [实施路线 Phase 3](./roadmap.md) · [契约与事件](../architecture/contracts-and-events.md)

## 1. 目的

用**最小可运行**的第一方编译期插件，验证：

- Manifest → 注册表 → Web/API/Agent 贡献
- 权限码、菜单、DataScope、启停、事件、迁移、测试全路径

推荐插件 ID：`demo-notes`（演示便签）。若团队更倾向真实域，可替换为 `announcements` 等同等复杂度域，但须保持「CRUD + 权限 + 组织归属」完整。

## 2. 范围

### 包含

| 能力 | 说明 |
|------|------|
| 便签 CRUD | 标题、内容、归属组织、创建人 |
| 权限 | `demo:note:list\|get\|create\|update\|delete` |
| 菜单 / 路由 | `/demo/notes` 列表与详情 |
| DataScope | 列表按创建人组织过滤 |
| 配置 | `maxNotesPerUser`（插件 config） |
| 事件 | `demo.note.created` |
| 启停 | 停用后菜单与 API 不可用 |
| 可选 AI | `list_my_notes` Tool + 简单 Tool UI |

### 不包含

- 富文本协同、实时同步
- 独立数据库、独立部署
- 第三方安装包

## 3. 目录结构

```text
plugins/demo-notes/
├── package.json                 # @zen/plugin-demo-notes
├── zen.plugin.json
├── src/
│   ├── index.ts
│   ├── activate.ts
│   ├── deactivate.ts
│   ├── config.schema.ts
│   ├── web/
│   │   ├── index.ts
│   │   ├── routes.tsx
│   │   ├── menus.ts             # 可选；推荐由 route meta 派生
│   │   └── pages/notes-page.tsx
│   ├── api/
│   │   ├── demo-notes.module.ts
│   │   ├── note.controller.ts
│   │   ├── note.service.ts
│   │   ├── note.repository.ts
│   │   └── listeners/note-created.listener.ts
│   └── agent/
│       └── tools.ts
└── tests/
    ├── manifest.test.ts
    └── note.permissions.spec.ts
```

## 4. Manifest 示例

```json
{
  "id": "demo-notes",
  "name": "演示便签",
  "version": "0.1.0",
  "platformVersion": "^0.1.0",
  "dependsOn": [],
  "contributions": {
    "permissions": [
      { "code": "demo:note:list", "name": "查看便签列表", "module": "demo" },
      { "code": "demo:note:get", "name": "查看便签详情", "module": "demo" },
      { "code": "demo:note:create", "name": "创建便签", "module": "demo" },
      { "code": "demo:note:update", "name": "更新便签", "module": "demo" },
      { "code": "demo:note:delete", "name": "删除便签", "module": "demo" }
    ],
    "routes": "./src/web/routes",
    "apiModule": "./src/api/demo-notes.module",
    "agentTools": "./src/agent/tools",
    "events": ["./src/api/listeners/note-created.listener"],
    "configSchema": "./src/config.schema.ts"
  },
  "lifecycle": {
    "activate": "./src/activate.ts",
    "deactivate": "./src/deactivate.ts"
  }
}
```

## 5. 数据模型（合入平台 Prisma）

```prisma
model DemoNote {
  id             String   @id @default(cuid())
  tenantId       String   @map("tenant_id")
  organizationId String   @map("organization_id")
  title          String
  content        String?
  createdBy      String   @map("created_by")
  updatedBy      String?  @map("updated_by")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  @@index([tenantId, organizationId])
  @@index([tenantId, createdBy])
  @@map("demo_notes")
}
```

- migration 由平台仓统一执行
- 权限种子写入同版本 migration 或 seed

## 6. API 设计

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/demo/notes` | `demo:note:list` |
| GET | `/api/demo/notes/:id` | `demo:note:get` |
| POST | `/api/demo/notes` | `demo:note:create` |
| PATCH | `/api/demo/notes/:id` | `demo:note:update` |
| DELETE | `/api/demo/notes/:id` | `demo:note:delete` |

实现要点：

- Controller 标注 `@RequirePermission`
- Repository 查询调用 `applyDataScope`
- 创建时写入 `tenantId`、`organizationId`（默认主职）、`createdBy`
- 成功创建后发射 `demo.note.created`

## 7. 前端

- 路由 `staticData`：

```ts
staticData: {
  title: '演示便签',
  group: 'demo',
  order: 100,
  permissions: ['demo:note:list'],
}
```

- 使用 `@zen/ui` + 平台 DataTable 模式
- 写操作按钮按权限码拆分显示

## 8. Agent Tool（可选）

- Tool 名：`list_my_notes`
- 所需权限：`demo:note:list`
- 通过 OpenAPI Client 调 API，**禁止**直访 Prisma
- 前端可注册只读 Tool UI 展示结果表

## 9. 配置

```ts
// config.schema.ts
z.object({
  maxNotesPerUser: z.number().int().positive().default(100),
})
```

创建时校验配额；超限返回业务错误码。

## 10. 生命周期

| Hook | 行为 |
|------|------|
| `activate` | 确认权限种子存在；打日志；可选预热 |
| `deactivate` | 无破坏性操作；数据保留 |

超级管理员在插件管理中停用 → Registry 过滤 → 路由/Module 不暴露。

## 11. 测试计划

| 层级 | 用例 |
|------|------|
| Unit | Manifest 校验；config schema；权限码格式 |
| Integration | CRUD + 403；DataScope 隔离；停用后 404 |
| Contract | OpenAPI 含 `/api/demo/notes` |
| E2E | 登录 → 菜单可见 → 创建 → 列表 → 停用 → 菜单消失 |

## 12. 发布检查清单

1. `zen.plugin.json` 通过 `plugin:validate`
2. Prisma migration 已合入并在空库可 apply
3. 权限已绑定到用于演示的角色（如 admin）
4. Swagger 可见
5. `turbo run build test` 绿
6. 更新 [roadmap](./roadmap.md) Phase 3 DoD 勾选

## 13. 成功标准

开发者按照本文件 + 脚手架（Phase 4）可在半天内复制出第二个同构插件，且无需修改 Web Shell / API Kernel 的业务代码（仅重新生成 registry）。
