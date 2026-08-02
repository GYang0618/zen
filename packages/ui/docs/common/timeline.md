# Timeline

时间节点 / 审计时间线复合组件。

路径：`src/common/timeline.tsx`  
导入：

```tsx
import {
  Timeline,
  TimelineActions,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineMarker,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'
```

## 适用场景

- 侧栏「最近变更」
- 角色 / 组织审计日志
- 任意「时间轴 + 节点 + 文案」列表

不负责请求数据；由业务容器拉取后组装。

## 结构解剖

```text
Timeline                         // ol 容器
├── TimelineMarker               // 日期分组（可选快捷写法）
└── TimelineItem                 // 单条记录
    ├── TimelineIndicator        // 左侧节点（圆点 / marker / 自定义 Avatar）
    └── TimelineContent
        ├── TimelineHeader
        │   ├── TimelineTitle
        │   └── TimelineTimestamp
        ├── TimelineDescription
        └── TimelineActions      // Badge、按钮等扩展区
```

## API 摘要

| 组件 | 关键 Props | 说明 |
|------|------------|------|
| `Timeline` | 透传 `ol` | 列表容器，默认 `flex flex-col gap-5` |
| `TimelineItem` | `active?` `connector?` | `active` 高亮默认圆点；`connector={false}` 截断向下连接线；末项自动截断 |
| `TimelineIndicator` | `variant?: 'default' \| 'marker'` | 无 `children` 时渲染圆点；有 `children` 时替换为自定义媒体 |
| `TimelineMarker` | `children` | 日期分组快捷组件（内部已组合 marker 指示器 + 标题） |
| `TimelineContent` / `Header` / `Title` / `Description` / `Timestamp` / `Actions` | 透传对应元素 | 内容槽位，可用 `className` 微调字号字重 |

---

## 示例 1：最小可用

只展示标题、时间、描述，左侧默认圆点。

```tsx
<Timeline>
  <TimelineItem>
    <TimelineIndicator />
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>创建组织</TimelineTitle>
        <TimelineTimestamp>今天</TimelineTimestamp>
      </TimelineHeader>
      <TimelineDescription>新增了「产品研发中心」</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

---

## 示例 2：高亮当前项

首条或当前操作可用 `active` 加粗左侧圆点（仅默认圆点生效；自定义 Avatar 不受影响）。

```tsx
<Timeline>
  {items.map((item, index) => (
    <TimelineItem key={item.id} active={index === 0}>
      <TimelineIndicator />
      <TimelineContent>
        <TimelineHeader>
          <TimelineTitle className="font-semibold">{item.title}</TimelineTitle>
          <TimelineTimestamp>{item.timestamp}</TimelineTimestamp>
        </TimelineHeader>
        <TimelineDescription>{item.description}</TimelineDescription>
      </TimelineContent>
    </TimelineItem>
  ))}
</Timeline>
```

业务参考：`apps/web/.../roles-v2/components/role-audit-timeline-card.tsx`

---

## 示例 3：日期分组

用 `TimelineMarker` 插入日期分隔；组与组之间可用 `connector={false}` 断开竖线。

```tsx
<Timeline>
  <TimelineMarker>2026-05-20</TimelineMarker>

  <TimelineItem>
    <TimelineIndicator />
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>更新角色权限</TimelineTitle>
        <TimelineTimestamp>14:30</TimelineTimestamp>
      </TimelineHeader>
    </TimelineContent>
  </TimelineItem>

  <TimelineItem connector={false}>
    <TimelineIndicator />
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>添加成员</TimelineTitle>
        <TimelineTimestamp>10:24</TimelineTimestamp>
      </TimelineHeader>
    </TimelineContent>
  </TimelineItem>

  <TimelineMarker>2026-05-18</TimelineMarker>

  <TimelineItem>
    <TimelineIndicator />
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>创建角色</TimelineTitle>
        <TimelineTimestamp>09:41</TimelineTimestamp>
      </TimelineHeader>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

---

## 示例 4：头像节点 + 动作文案 + Badge

自定义 `TimelineIndicator` 的 `children`，并在 `TimelineActions` 放标签。

```tsx
import {
  Timeline,
  TimelineActions,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineMarker,
  TimelineTimestamp,
  TimelineTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge
} from '@zen/ui'

<Timeline>
  <TimelineMarker>May 20, 2025</TimelineMarker>

  <TimelineItem>
    <TimelineIndicator>
      <Avatar className="size-6">
        <AvatarImage src="/avatars/olivia.png" alt="Olivia Rhye" />
        <AvatarFallback>OR</AvatarFallback>
      </Avatar>
    </TimelineIndicator>
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>
          <span className="font-medium">Olivia Rhye</span>{' '}
          <span className="font-normal">changed status</span>
        </TimelineTitle>
        <TimelineTimestamp className="text-sm">2:30 PM</TimelineTimestamp>
      </TimelineHeader>
      <TimelineActions className="mt-1">
        <Badge variant="secondary">To Do</Badge>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          In Progress
        </Badge>
      </TimelineActions>
    </TimelineContent>
  </TimelineItem>

  <TimelineItem connector={false}>
    <TimelineIndicator>
      <Avatar className="size-6">
        <AvatarImage src="/avatars/noah.png" alt="Noah Kim" />
        <AvatarFallback>NK</AvatarFallback>
      </Avatar>
    </TimelineIndicator>
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>
          <span className="font-medium">Noah Kim</span>{' '}
          <span className="font-normal">moved subtask</span>
        </TimelineTitle>
        <TimelineTimestamp className="text-sm">4:15 PM</TimelineTimestamp>
      </TimelineHeader>
      <TimelineDescription className="leading-5">
        Build team-based assignee suggestions
      </TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

业务参考：`apps/web/.../organization-v2/components/organization-detail-side-overview.tsx`

---

## 示例 5：业务层薄封装（推荐）

当同一 feature 内多次复用同一套「头像 + 姓名 + 动作」时，在 feature 内包一层展示组件，**不要**回写到 `@zen/ui`。

```tsx
function OrganizationTimelineEvent({
  name,
  action,
  time,
  avatarSrc,
  avatarAlt,
  description,
  badges,
  connector = true
}: {
  name: string
  action: string
  time: string
  avatarSrc: string
  avatarAlt: string
  description?: string
  badges?: Array<{ label: string }>
  connector?: boolean
}) {
  return (
    <TimelineItem connector={connector}>
      <TimelineIndicator>
        <Avatar className="size-6">
          <AvatarImage src={avatarSrc} alt={avatarAlt} />
          <AvatarFallback>{avatarAlt.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </TimelineIndicator>
      <TimelineContent>
        <TimelineHeader>
          <TimelineTitle>
            <span className="font-medium">{name}</span>{' '}
            <span className="font-normal">{action}</span>
          </TimelineTitle>
          <TimelineTimestamp className="text-sm">{time}</TimelineTimestamp>
        </TimelineHeader>
        {description ? <TimelineDescription>{description}</TimelineDescription> : null}
        {badges?.length ? (
          <TimelineActions className="mt-1">
            {badges.map((badge) => (
              <Badge key={badge.label} variant="secondary">
                {badge.label}
              </Badge>
            ))}
          </TimelineActions>
        ) : null}
      </TimelineContent>
    </TimelineItem>
  )
}
```

---

## 连接线规则

| 情况 | 行为 |
|------|------|
| 普通项 | 竖线向下延伸，穿过 `gap` 接到下一项 |
| 列表最后一项 | 自动截断（只盖住节点高度） |
| `connector={false}` | 强制截断，适合「本日最后一条」再接下一个 `TimelineMarker` |

## 注意事项

- 列表项必须是 `Timeline` 的直接子节点（`TimelineItem` / `TimelineMarker`），才能正确应用 `:last-child` 连接线逻辑。
- `TimelineTitle` 默认 `font-medium`；需要「姓名加粗、动作常规」时，在内部用 `span` 分别控制字重。
- 业务文案、权限、接口类型留在 feature；`common` 只提供槽位。
