# Timeline

竖向时间线复合组件，适用于审计日志、活动流等场景。

路径：`src/common/timeline.tsx`  
导入：

```tsx
import {
  Timeline,
  TimelineActions,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineGroup,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSide,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'
```

> 实现：CSS Grid + Subgrid，内容区始终与「全量最宽节点」对齐，不会被大节点挡住。

## 结构解剖

```text
Timeline
├── TimelineGroup                 // 可选：分组（组与组之间断开连线）
│   └── TimelineItem
│       ├── TimelineSide          // 可选：左侧时间/日期列
│       ├── TimelineIndicator     // 节点（默认空心点 / children 插槽）
│       ├── TimelineConnector     // 向下竖线（末项自动隐藏）
│       └── TimelineContent
│           ├── TimelineHeader
│           │   ├── TimelineTitle
│           │   └── TimelineTimestamp
│           ├── TimelineDescription
│           └── TimelineActions
└── TimelineItem                  // 也可直接挂在 Timeline 下
```

## API 摘要

| 组件 | 说明 |
|------|------|
| `Timeline` | 时间线容器 |
| `TimelineGroup` | 分组容器（组与组之间断开） |
| `TimelineItem` | 一条时间线条目 |
| `TimelineIndicator` | 左侧节点；无 `children` 时自身即默认点，`className` 可改 `bg` / `border`；有 `children` 时作为容器直接渲染子节点 |
| `TimelineConnector` | 从当前节点向下的竖线 |
| `TimelineContent` | 右侧内容区 |
| `TimelineSide` | 可选左侧时间/日期列 |
| `TimelineHeader` / `TimelineTitle` / `TimelineDescription` / `TimelineTimestamp` / `TimelineActions` | 内容区内部排版 |

## 示例 1：默认空心点 + 标题与描述

```tsx
<Timeline>
  <TimelineItem>
    <TimelineIndicator />
    <TimelineConnector />
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>Payment captured</TimelineTitle>
        <TimelineTimestamp>Today, 9:12 AM</TimelineTimestamp>
      </TimelineHeader>
      <TimelineDescription>Visa ending in 4242 approved for the full order amount.</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## 示例 2：实心彩色点（`className` 改默认点）

```tsx
<Timeline>
  <TimelineItem>
    <TimelineIndicator className="bg-orange-500 border-0" aria-hidden />
    <TimelineConnector />
    <TimelineContent>
      <TimelineTitle>Review window opened</TimelineTitle>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## 示例 3：节点为 Avatar（插槽 children）

```tsx
<Timeline>
  <TimelineItem>
    <TimelineIndicator>
      <Avatar size="sm">
        <AvatarImage src="/user.png" alt="User" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </TimelineIndicator>
    <TimelineConnector />
    <TimelineContent>
      <TimelineHeader>
        <TimelineTitle>
          <span className="font-medium">Olivia Rhye</span> changed status
        </TimelineTitle>
        <TimelineTimestamp>2:30 PM</TimelineTimestamp>
      </TimelineHeader>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## 示例 4：节点为 Icon（插槽 children）

```tsx
<Timeline>
  <TimelineItem>
    <TimelineIndicator className="size-6">
      <Icon className="size-4 text-muted-foreground" />
    </TimelineIndicator>
    <TimelineConnector />
    <TimelineContent>
      <TimelineTitle>Evidence pack uploaded</TimelineTitle>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## 示例 5：分组时间线（组头连组内，组与组断开）

```tsx
<Timeline>
  <TimelineGroup>
    <TimelineItem>
      <TimelineIndicator />
      <TimelineConnector />
      <TimelineContent>
        <TimelineTitle className="py-0.5 font-semibold">May 20, 2025</TimelineTitle>
      </TimelineContent>
    </TimelineItem>

    <TimelineItem>
      <TimelineIndicator>
        <Avatar size="sm" />
      </TimelineIndicator>
      <TimelineConnector />
      <TimelineContent>
        <TimelineTitle>changed status</TimelineTitle>
      </TimelineContent>
    </TimelineItem>
  </TimelineGroup>

  <TimelineGroup>
    <TimelineItem>
      <TimelineIndicator />
      <TimelineConnector />
      <TimelineContent>
        <TimelineTitle className="py-0.5 font-semibold">May 18, 2025</TimelineTitle>
      </TimelineContent>
    </TimelineItem>
  </TimelineGroup>
</Timeline>
```
