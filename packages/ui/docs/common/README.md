# 自研通用组件（common）

存放路径：`packages/ui/src/common/`

这里是与 shadcn 官网组件区分开的**手写通用原语**。只表达展示结构，不绑定具体业务域（组织、角色、审计等业务组装放在 `apps/web` feature 内）。

## 组件索引

| 组件 | 说明 | 文档 |
|------|------|------|
| **PageHeader** | 页面内容区页头（列表 / 详情） | [page-header.md](./page-header.md) |
| **Timeline** | 竖向时间线 / 活动流 | [timeline.md](./timeline.md) |
| **GradientText** | 渐变流动文字 | [text-effect.md](./text-effect.md) |
| **TypingText** | 打字机效果文字 | [text-effect.md](./text-effect.md) |

## 编写规范

1. **复合组件**：用 `PageHeader` / `Timeline` 这类前缀命名，风格对齐 `Item*`、`Field*`。
2. **文档**：细分槽位 ≥ 3 个时，按「最小可用 → 常用组合 → 完整场景」写示例。
3. **导出**：新增文件后执行 `pnpm --filter @zen/ui sync:exports`（或保持 `dev` watch）。
4. **不要**：把「组织成员变更」「登录失败」这类业务变体写进 `common/`。
