import { CHART_DEMOS } from './catalog-chart-demos'
import { DATA_DEMOS, ENTITY_DEMOS, LAYOUT_DEMOS, PRIMITIVE_DEMOS } from './catalog-widget-demos'

import type { CatalogDemoGroup } from './catalog-demo'

/** zen catalog 中预览页原先未覆盖的组件。已有 10 张拓展卡片仍由页面原区块展示。 */
export const CATALOG_DEMO_GROUPS: CatalogDemoGroup[] = [
  {
    id: 'charts',
    title: '统计图表',
    badge: 'Area / Bar / Line / Pie / Radar / Gauge / Funnel',
    demos: CHART_DEMOS
  },
  {
    id: 'layout',
    title: '布局容器',
    badge: 'Row · Column · Grid · DashboardCard · ScrollArea · Tabs',
    demos: LAYOUT_DEMOS
  },
  {
    id: 'primitives',
    title: '基础展示',
    badge: 'Icon · Avatar · Badge · Item',
    demos: PRIMITIVE_DEMOS
  },
  {
    id: 'data',
    title: '表格与时间线',
    badge: 'DataTable · Timeline',
    demos: DATA_DEMOS
  },
  {
    id: 'entities',
    title: '实体卡片',
    badge: 'User · Role · Post · Organization',
    demos: ENTITY_DEMOS
  }
]
