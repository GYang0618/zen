# PageHeader

页面内容区页头复合组件，覆盖列表页「标题 + 描述 + 操作」与详情页「返回 + 媒体 + 标题 + 元信息 + 操作」。

路径：`src/common/page-header.tsx`  
导入：

```tsx
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle
} from '@zen/ui'
```

## 结构解剖

```text
PageHeader                       // Flex 横排
├── （返回按钮等自定义节点）       // 可选，直接挂在根下
├── PageHeaderMedia              // 可选：图标 / 头像
├── PageHeaderContent            // 标题 + 描述纵向堆叠
│   ├── PageHeaderTitle
│   └── PageHeaderDescription
└── PageHeaderActions            // 可选：右侧操作
```

## API 摘要

| 组件 | 说明 |
|------|------|
| `PageHeader` | 根容器（Flex：`items-start gap-4`） |
| `PageHeaderMedia` | 圆形媒体槽（默认 `size-16` + primary 底） |
| `PageHeaderContent` | 标题 + 描述包装器（`flex-col gap-1`，占满剩余宽度） |
| `PageHeaderTitle` | `size`: `sm` \| `default` \| `lg`；`as`: `h1` \| `h2` \| `h3` |
| `PageHeaderDescription` | 副文案 / 元信息 |
| `PageHeaderActions` | 右侧操作区 |

---

## 示例 1：最小可用（列表页）

```tsx
<PageHeader>
  <PageHeaderContent>
    <PageHeaderTitle>组织架构</PageHeaderTitle>
    <PageHeaderDescription>
      企业组织架构管理，管理分公司、部门、业务中心、岗位等
    </PageHeaderDescription>
  </PageHeaderContent>
  <PageHeaderActions>
    <Button>新建组织</Button>
  </PageHeaderActions>
</PageHeader>
```

---

## 示例 2：紧凑字号（设置页）

```tsx
<PageHeader className="items-center">
  <PageHeaderContent>
    <PageHeaderTitle size="sm">个人资料</PageHeaderTitle>
    <PageHeaderDescription className="text-sm">
      管理你的公开资料与联系方式
    </PageHeaderDescription>
  </PageHeaderContent>
  <PageHeaderActions>{actions}</PageHeaderActions>
</PageHeader>
```

---

## 示例 3：详情页（返回 + 图标 + Badge + 元信息）

```tsx
<PageHeader>
  <Button variant="outline" size="icon-lg" className="rounded-full" asChild>
    <Link to="/system/organization" aria-label="返回组织管理">
      <ArrowLeft />
    </Link>
  </Button>
  <PageHeaderMedia>
    <Building2 />
  </PageHeaderMedia>
  <PageHeaderContent>
    <PageHeaderTitle size="lg" as="h1" className="inline-flex items-center gap-3">
      {organization.name}
      <Badge variant="secondary">正常</Badge>
    </PageHeaderTitle>
    <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
      <span>{organization.code}</span>
      <span>•</span>
      <span>{organization.type}</span>
      <span>•</span>
      <span>{organization.description}</span>
    </PageHeaderDescription>
  </PageHeaderContent>
  <PageHeaderActions>
    <Button variant="outline">
      <Pencil />
      编辑
    </Button>
  </PageHeaderActions>
</PageHeader>
```

## 注意事项

- `PageHeaderTitle` 与 `PageHeaderDescription` 必须包在 `PageHeaderContent` 内。
- 返回按钮等自定义节点直接作为 `PageHeader` 子元素，不必再包一层 Group。
- 业务返回链接、权限按钮留在 feature；`common` 只提供布局槽位。
- 标题旁 Badge 直接放进 `PageHeaderTitle`（`inline-flex items-center gap-3`）。
- 设置页若需要底部分割线，在 feature 外包一层 `Separator`，不要塞进原语。
- feature 内不要再封装 `SystemPageHeader` / `SettingsPageHeader`；统一直接组合本组件。
