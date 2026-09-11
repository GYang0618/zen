import { z } from 'zod'

import type { CatalogDefinitions } from '@copilotkit/a2ui-renderer'

export const commonCatalogDefinitions = {
  Row: {
    description: '横向弹性布局容器，用于并排排布多个子组件（如多个指标卡）。',
    props: z.object({
      children: z.array(z.string()).describe('子组件 ID 列表'),
      gap: z.number().optional().describe('子项间距（像素），默认 12'),
      align: z.enum(['start', 'center', 'end', 'stretch']).optional().describe('交叉轴对齐方式')
    })
  },
  Column: {
    description: '纵向弹性布局容器，用于垂直排布多个子组件。',
    props: z.object({
      children: z.array(z.string()).describe('子组件 ID 列表'),
      gap: z.number().optional().describe('子项间距（像素），默认 16')
    })
  },
  DashboardCard: {
    description: '通用的卡片容器，包含标题和可选副标题，通过 child 嵌入子组件。',
    props: z.object({
      title: z.string().describe('卡片主标题'),
      subtitle: z.string().optional().describe('卡片副标题或说明'),
      child: z.string().optional().describe('子组件 ID')
    })
  },
  Metric: {
    description: '关键业务指标或 KPI 数据卡片，支持展示数值及环比/同比趋势。',
    props: z.object({
      label: z.string().describe('指标名称'),
      value: z.string().describe('当前指标数值'),
      trend: z.enum(['up', 'down', 'neutral']).optional().describe('指标变化趋势'),
      trendValue: z.string().optional().describe('趋势变化具体百分比或数值')
    })
  },
  BarChart: {
    description: '自适应柱状数据图表，用于展示多分类或时间序列趋势。',
    props: z.object({
      title: z.string().optional().describe('图表标题'),
      data: z
        .array(
          z.object({
            label: z.string().describe('X 轴分类或时间'),
            value: z.number().describe('Y 轴统计数值')
          })
        )
        .describe('图表数据项列表'),
      color: z.string().optional().describe('柱体颜色代码')
    })
  }
} as unknown as CatalogDefinitions

export type CommonCatalogDefinitions = typeof commonCatalogDefinitions
