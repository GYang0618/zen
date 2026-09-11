import { ZEN_A2UI_CATALOG_ID } from '../constants'
import { createSurface, updateComponents, updateDataModel } from '../operations'

import type { User } from '@zen/shared'
import type { A2UIOperation } from '../operations'

export interface DashboardMetricItem {
  label: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export interface DashboardChartData {
  title: string
  data: Array<{ label: string; value: number }>
  color?: string
}

export interface BuildDynamicDashboardParams {
  surfaceId: string
  title: string
  summary?: string
  metrics?: DashboardMetricItem[]
  chart?: DashboardChartData
  userTable?: {
    title?: string
    users?: User[]
  }
  customComponents?: Array<Record<string, unknown>>
  catalogId?: string
}

/**
 * 动态组装灵活看板 (Dynamic Dashboard) 的 A2UI Surface 操作集。
 * 支持自由组合指标卡片 (Metric)、图表 (BarChart)、分栏布局 (Row/Column) 与数据表格 (UserTable)。
 */
export function buildDynamicDashboardSurface({
  surfaceId,
  title,
  summary,
  metrics,
  chart,
  userTable,
  customComponents,
  catalogId = ZEN_A2UI_CATALOG_ID
}: BuildDynamicDashboardParams): A2UIOperation[] {
  if (Array.isArray(customComponents) && customComponents.length > 0) {
    return [
      createSurface(surfaceId, catalogId),
      updateComponents(surfaceId, customComponents),
      updateDataModel(surfaceId, { title, summary, metrics, chart })
    ]
  }

  const components: Array<Record<string, unknown>> = []
  const rootChildren: string[] = []

  // 1. 如果有说明摘要
  if (summary) {
    components.push({
      id: 'dashboard-summary',
      component: 'Text',
      text: summary
    })
    rootChildren.push('dashboard-summary')
  }

  // 2. 如果包含顶栏指标卡列表
  if (Array.isArray(metrics) && metrics.length > 0) {
    const metricIds: string[] = []
    metrics.forEach((metric, index) => {
      const metricId = `metric-${index + 1}`
      metricIds.push(metricId)
      components.push({
        id: metricId,
        component: 'Metric',
        label: metric.label,
        value: metric.value,
        trend: metric.trend,
        trendValue: metric.trendValue,
        props: {
          label: metric.label,
          value: metric.value,
          trend: metric.trend,
          trendValue: metric.trendValue
        }
      })
    })

    components.push({
      id: 'metrics-row',
      component: 'Row',
      children: metricIds,
      gap: 12
    })
    rootChildren.push('metrics-row')
  }

  // 3. 如果包含柱状趋势图
  if (chart && Array.isArray(chart.data) && chart.data.length > 0) {
    components.push({
      id: 'dashboard-chart',
      component: 'BarChart',
      title: chart.title,
      data: chart.data,
      color: chart.color,
      props: {
        title: chart.title,
        data: chart.data,
        color: chart.color
      }
    })
    rootChildren.push('dashboard-chart')
  }

  // 4. 如果联动嵌入用户数据表格
  if (userTable) {
    const tableUsers = userTable.users ?? []
    const tableTitle = userTable.title ?? '相关用户记录'
    components.push({
      id: 'dashboard-user-table',
      component: 'UserTable',
      title: tableTitle,
      users: tableUsers,
      stateKey: 'users',
      props: {
        title: tableTitle,
        users: tableUsers,
        stateKey: 'users'
      }
    })
    rootChildren.push('dashboard-user-table')
  }

  // 5. 顶层容器 Column
  components.unshift({
    id: 'root',
    component: 'Column',
    children: rootChildren,
    gap: 16
  })

  return [
    createSurface(surfaceId, catalogId),
    updateComponents(surfaceId, components),
    updateDataModel(surfaceId, {
      title,
      summary,
      metrics,
      chart,
      users: userTable?.users ?? []
    })
  ]
}
