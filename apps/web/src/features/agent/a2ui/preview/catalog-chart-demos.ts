import { catalogDemo } from './catalog-demo'

import type { CatalogDemo, CatalogNode } from './catalog-demo'

const MONTHLY_TREND = [
  { label: '1月', value: 42 },
  { label: '2月', value: 38 },
  { label: '3月', value: 51 },
  { label: '4月', value: 47 },
  { label: '5月', value: 63 },
  { label: '6月', value: 71 }
]

const CATEGORY_SHARE = [
  { label: '研发', value: 36 },
  { label: '销售', value: 28 },
  { label: '运营', value: 18 },
  { label: '支持', value: 12 },
  { label: '管理', value: 6 }
]

const CHANNEL_SERIES = [
  { key: 'online', label: '线上' },
  { key: 'store', label: '门店' },
  { key: 'partner', label: '渠道' }
]

const CHANNEL_TREND = [
  { label: '1月', online: 42, store: 28, partner: 16 },
  { label: '2月', online: 46, store: 26, partner: 18 },
  { label: '3月', online: 51, store: 30, partner: 19 },
  { label: '4月', online: 48, store: 27, partner: 22 },
  { label: '5月', online: 58, store: 31, partner: 24 },
  { label: '6月', online: 64, store: 29, partner: 26 }
]

function singleChart(id: string, title: string, description: string): CatalogNode[] {
  return [
    {
      id: 'root',
      component: id,
      title,
      description,
      data: MONTHLY_TREND
    }
  ]
}

export const CHART_DEMOS: CatalogDemo[] = [
  catalogDemo(
    'area-chart',
    'AreaChart',
    '单系列面积图，适合一条时间序列的累计走势。',
    singleChart('AreaChart', '月度活跃用户', '近 6 个月 MAU（千人）')
  ),
  catalogDemo(
    'bar-chart',
    'BarChart',
    '单系列垂直柱状图，适合少量分类的绝对量对比。',
    singleChart('BarChart', '月度新增订单', '近 6 个月订单量（千笔）')
  ),
  catalogDemo(
    'line-chart',
    'LineChart',
    '单系列折线图，适合连续指标的走势。',
    singleChart('LineChart', '日活趋势', '近 6 个月日活均值（千人）')
  ),
  catalogDemo('pie-chart', 'PieChart', '基础饼图，适合少量分类的结构占比。', [
    {
      id: 'root',
      component: 'PieChart',
      title: '人力投入占比',
      description: '按职能统计本季度投入',
      data: CATEGORY_SHARE
    }
  ]),
  catalogDemo('radar-chart', 'RadarChart', '雷达图，适合同一对象在多个维度上的能力轮廓。', [
    {
      id: 'root',
      component: 'RadarChart',
      title: '团队能力轮廓',
      description: '各职能相对投入强度',
      data: CATEGORY_SHARE
    }
  ]),
  catalogDemo('radial-chart', 'RadialChart', '径向条形图，适合少量分类的环形对比。', [
    {
      id: 'root',
      component: 'RadialChart',
      title: '预算占用',
      description: '各部门预算消耗',
      data: CATEGORY_SHARE
    }
  ]),
  catalogDemo(
    'horizontal-bar-chart',
    'HorizontalBarChart',
    '横向条形图，适合长标签排行，并在条尾标注数值。',
    [
      {
        id: 'root',
        component: 'HorizontalBarChart',
        title: '接口调用 Top 5',
        description: '近 24 小时请求量',
        sorted: 'desc',
        showValues: true,
        valueUnit: '次',
        data: [
          { label: '/api/checkout', value: 12840 },
          { label: '/api/search', value: 9640 },
          { label: '/api/catalog', value: 7320 },
          { label: '/api/auth', value: 5180 },
          { label: '/api/billing', value: 2460 }
        ]
      }
    ]
  ),
  catalogDemo(
    'grouped-bar-chart',
    'GroupedBarChart',
    '分组柱状图，适合同一分类下多系列对比，例如实际与预算。',
    [
      {
        id: 'root',
        component: 'GroupedBarChart',
        title: '渠道收入对比',
        description: '线上、门店与渠道并列',
        series: CHANNEL_SERIES,
        data: CHANNEL_TREND
      }
    ]
  ),
  catalogDemo('stacked-bar-chart', 'StackedBarChart', '堆叠柱状图，适合总量以及内部构成。', [
    {
      id: 'root',
      component: 'StackedBarChart',
      title: '渠道收入构成',
      description: '纵向堆叠',
      layout: 'vertical',
      series: CHANNEL_SERIES,
      data: CHANNEL_TREND
    }
  ]),
  catalogDemo('multi-line-chart', 'MultiLineChart', '多折线，适合多条时序指标同屏对比。', [
    {
      id: 'root',
      component: 'MultiLineChart',
      title: '环境响应时间',
      description: '平滑曲线，单位 ms',
      curve: 'monotone',
      showDots: true,
      series: [
        { key: 'prod', label: '生产' },
        { key: 'staging', label: '预发' }
      ],
      data: [
        { label: '周一', prod: 142, staging: 188 },
        { label: '周二', prod: 136, staging: 174 },
        { label: '周三', prod: 151, staging: 196 },
        { label: '周四', prod: 128, staging: 162 },
        { label: '周五', prod: 133, staging: 170 }
      ]
    }
  ]),
  catalogDemo(
    'stacked-area-chart',
    'StackedAreaChart',
    '堆叠面积图，适合累积总量随时间的构成变化。',
    [
      {
        id: 'root',
        component: 'StackedAreaChart',
        title: '流量来源累积',
        curve: 'monotone',
        series: CHANNEL_SERIES,
        data: CHANNEL_TREND
      }
    ]
  ),
  catalogDemo('composed-chart', 'ComposedChart', '柱折双轴图：左轴绝对量，右轴比率。', [
    {
      id: 'root',
      component: 'ComposedChart',
      title: '营收与环比增速',
      barLabel: '营收',
      lineLabel: '环比',
      barUnit: '万',
      lineUnit: '%',
      secondaryAxis: true,
      data: [
        { label: '1月', barValue: 120, lineValue: 6.2 },
        { label: '2月', barValue: 132, lineValue: 10.0 },
        { label: '3月', barValue: 128, lineValue: -3.0 },
        { label: '4月', barValue: 146, lineValue: 14.1 },
        { label: '5月', barValue: 158, lineValue: 8.2 },
        { label: '6月', barValue: 171, lineValue: 8.2 }
      ]
    }
  ]),
  catalogDemo(
    'gauge-chart',
    'GaugeChart',
    '半圆仪表盘。同一 Grid 中展示默认、达标、预警与危险四种状态。',
    [
      {
        id: 'root',
        component: 'Grid',
        columns: 2,
        gap: 12,
        children: ['gauge-default', 'gauge-success', 'gauge-warning', 'gauge-danger']
      },
      {
        id: 'gauge-default',
        component: 'GaugeChart',
        title: '季度目标达成',
        value: 78.5,
        unit: '%',
        subtext: '较上周 +4.2%',
        status: 'default'
      },
      {
        id: 'gauge-success',
        component: 'GaugeChart',
        title: '登录成功率',
        value: 99.2,
        unit: '%',
        subtext: '达标',
        status: 'success'
      },
      {
        id: 'gauge-warning',
        component: 'GaugeChart',
        title: 'CPU 负载',
        value: 81,
        unit: '%',
        subtext: '接近阈值',
        status: 'warning'
      },
      {
        id: 'gauge-danger',
        component: 'GaugeChart',
        title: '错误率',
        value: 6.4,
        max: 10,
        unit: '%',
        subtext: '超过 SLO',
        status: 'destructive'
      }
    ],
    'full'
  ),
  catalogDemo('funnel-chart', 'FunnelChart', '阶段漏斗，底部展示相邻阶段转化率。', [
    {
      id: 'root',
      component: 'FunnelChart',
      title: '注册转化漏斗',
      description: '近 7 日访问到付费',
      showConversionRate: true,
      unit: '人',
      data: [
        { label: '访问', value: 12000 },
        { label: '注册', value: 4800 },
        { label: '激活', value: 2100 },
        { label: '付费', value: 640 }
      ]
    }
  ]),
  catalogDemo('scatter-chart', 'ScatterChart', '散点图，适合双变量相关性和分群。', [
    {
      id: 'root',
      component: 'ScatterChart',
      title: '活跃度与客单价',
      xAxisLabel: '月活天数',
      yAxisLabel: '客单价',
      xAxisUnit: '天',
      yAxisUnit: '元',
      data: [
        { x: 4, y: 86, z: 12, label: '试用', category: '新客' },
        { x: 9, y: 140, z: 18, label: '成长', category: '新客' },
        { x: 16, y: 260, z: 28, label: '华东企业', category: '企业' },
        { x: 21, y: 420, z: 36, label: '战略客户', category: '企业' },
        { x: 12, y: 96, z: 14, label: '个人专业版', category: '个人' },
        { x: 18, y: 188, z: 22, label: '团队版', category: '团队' }
      ]
    }
  ])
]
