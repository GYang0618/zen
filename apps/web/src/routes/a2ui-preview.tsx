import { createFileRoute } from '@tanstack/react-router'
import { Badge, Button, cn } from '@zen/ui'
import {
  Activity,
  Bot,
  Calendar,
  DollarSign,
  Eye,
  GitCommit,
  Layers,
  LayoutDashboard,
  Moon,
  PieChart,
  Shapes,
  Sun
} from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  ActivityCalendar,
  BreakdownCard,
  DonutChart,
  DumbbellChart,
  GanttChart,
  HeatmapCard,
  SparklineCard,
  StatCard,
  UptimeCard,
  WaterfallChart
} from '@/features/agent/a2ui/components'
import { buildDemoActivityDays } from '@/features/agent/a2ui/preview/activity-demo-days'
import { AgentRuntimeSimulator } from '@/features/agent/a2ui/preview/agent-runtime-simulator'
import { CatalogGallery } from '@/features/agent/a2ui/preview/catalog-gallery'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type React from 'react'
import type {
  ActivityCalendarProps,
  BreakdownCardProps,
  BreakdownItem,
  BreakdownSegment,
  DonutCategoryItem,
  DonutChartProps,
  DumbbellChartProps,
  DumbbellItem,
  GanttChartProps,
  GanttMetric,
  GanttTaskItem,
  HeatmapCardProps,
  HeatmapCell,
  HeatmapIntensity,
  SparklineCardProps,
  StatCardProps,
  UptimeCardProps,
  UptimeServiceItem,
  UptimeStatus,
  WaterfallChartProps,
  WaterfallStep
} from '@/features/agent/a2ui/components'

export const Route = createFileRoute('/a2ui-preview')({
  component: A2uiPreviewPage
})

type ComponentTab =
  | 'agent-e2e'
  | 'all'
  | 'catalog'
  | 'stat-card'
  | 'breakdown-card'
  | 'donut-chart'
  | 'heatmap-card'
  | 'sparkline-card'
  | 'dumbbell-chart'
  | 'activity-calendar'
  | 'waterfall-chart'
  | 'uptime-card'
  | 'gantt-chart'

const TABS: Array<{ id: ComponentTab; label: string; icon: typeof Layers }> = [
  { id: 'agent-e2e', label: '🤖 Agent 真实调用实测 (E2E Pipeline)', icon: Bot },
  { id: 'all', label: '全部概览 (All)', icon: LayoutDashboard },
  { id: 'catalog', label: '其余组件目录', icon: Shapes },
  { id: 'stat-card', label: '1. StatCard', icon: DollarSign },
  { id: 'breakdown-card', label: '2. BreakdownCard', icon: Layers },
  { id: 'donut-chart', label: '3. DonutChart', icon: PieChart },
  { id: 'heatmap-card', label: '4. HeatmapCard', icon: Activity },
  { id: 'sparkline-card', label: '5. SparklineCard', icon: Eye },
  { id: 'dumbbell-chart', label: '6. DumbbellChart', icon: GitCommit },
  { id: 'activity-calendar', label: '7. ActivityCalendar', icon: Calendar },
  { id: 'waterfall-chart', label: '8. WaterfallChart', icon: Layers },
  { id: 'uptime-card', label: '9. UptimeCard', icon: Activity },
  { id: 'gantt-chart', label: '10. GanttChart', icon: Calendar }
]

function RenderA2ui<T>({
  component: Component,
  props
}: {
  component: (rendererProps: RendererProps<T>) => React.ReactElement | null
  props: T
}) {
  const dummyProps: RendererProps<T> = {
    props,
    children: () => null
  }
  return <Component {...dummyProps} />
}

function A2uiPreviewPage() {
  const [activeTab, setActiveTab] = useState<ComponentTab>('agent-e2e')
  const [isDark, setIsDark] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<'full' | '1024' | '768' | '420'>('full')

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // --- Mock Data Definitions ---

  // 1. StatCard Data
  const statCardsData: StatCardProps[] = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      trend: 'up',
      trendValue: '+20.1%',
      trendLabel: 'from last month',
      previousValue: '$37,650.00',
      previousLabel: 'Previous period',
      period: 'Last 30 days',
      iconPosition: 'left',
      icon: 'dollar-sign',
      sparkline: [30, 45, 40, 55, 60, 75, 90]
    },
    {
      title: 'Subscriptions',
      value: '+2,350',
      trend: 'up',
      trendValue: '+180.1%',
      trendLabel: 'from last month',
      previousValue: '+840',
      previousLabel: 'Previous period',
      period: 'Last 30 days',
      iconPosition: 'left',
      icon: 'users'
    },
    {
      title: 'Sales',
      value: '+12,234',
      trend: 'up',
      trendValue: '+19%',
      trendLabel: 'from last month',
      previousValue: '+10,230',
      period: 'Last 30 days',
      iconPosition: 'left',
      icon: 'credit-card'
    },
    {
      title: 'Active Now',
      value: '+573',
      trend: 'up',
      trendValue: '+201',
      trendLabel: 'since last hour',
      previousValue: '+372',
      period: 'Live',
      iconPosition: 'left',
      icon: 'activity'
    }
  ]

  // 2. BreakdownCard Data
  const breakdownSegments: BreakdownSegment[] = [
    { label: 'Direct', value: 45, color: 'bg-primary' },
    { label: 'Organic Search', value: 25, color: 'bg-chart-2' },
    { label: 'Paid Social', value: 18, color: 'bg-chart-3' },
    { label: 'Referral', value: 12, color: 'bg-chart-4' }
  ]
  const breakdownItems: BreakdownItem[] = [
    {
      id: 'direct',
      label: 'Direct',
      initial: 'DIR',
      value: '$58.2k',
      secondaryValue: '1,248 visits',
      trend: 'up',
      trendValue: '+12.4%'
    },
    {
      id: 'organic',
      label: 'Organic Search',
      initial: 'ORG',
      value: '$32.4k',
      secondaryValue: '852 visits',
      trend: 'up',
      trendValue: '+8.1%'
    },
    {
      id: 'paid',
      label: 'Paid Social',
      initial: 'SOC',
      value: '$23.3k',
      secondaryValue: '430 visits',
      trend: 'down',
      trendValue: '-3.2%'
    },
    {
      id: 'referral',
      label: 'Referral',
      initial: 'REF',
      value: '$15.5k',
      secondaryValue: '215 visits',
      trend: 'up',
      trendValue: '+4.6%'
    }
  ]
  const breakdownProps: BreakdownCardProps = {
    title: 'Revenue Channels',
    totalValue: '$129.4k',
    totalLabel: 'Total Revenue',
    icon: 'layers',
    segments: breakdownSegments,
    items: breakdownItems
  }

  // 3. DonutChart Data
  const donutData: DonutCategoryItem[] = [
    { label: 'Footwear', value: 42500, formattedValue: '$42,500', percentage: '34%' },
    { label: 'Apparel', value: 35000, formattedValue: '$35,000', percentage: '28%' },
    { label: 'Accessories', value: 27500, formattedValue: '$27,500', percentage: '22%' },
    { label: 'Equipment', value: 20000, formattedValue: '$20,000', percentage: '16%' }
  ]
  const donutProps: DonutChartProps = {
    title: 'Sales by Category',
    description: 'Distribution across physical product lines',
    centerLabel: 'Total Sales',
    centerValue: '$125,000',
    trend: 'up',
    trendValue: '+14.2% vs last month',
    data: donutData,
    showActionMenu: true
  }

  // 4. HeatmapCard Data
  const heatmapProps: HeatmapCardProps = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
    const cells: HeatmapCell[] = []

    for (const d of days) {
      for (const h of hours) {
        const val = Math.floor(Math.random() * 100)
        const intensity: HeatmapIntensity =
          val > 70 ? 'high' : val > 40 ? 'medium' : val > 15 ? 'low' : 'none'
        cells.push({
          x: h,
          y: d,
          value: val,
          intensity,
          tooltip: {
            title: `${d} ${h}`,
            subtitle: 'Traffic Volume',
            value: `${val} active visitors`
          }
        })
      }
    }

    return {
      title: 'Traffic Sources Heatmap',
      trend: 'up',
      trendValue: '+18.4% peak load',
      xLabels: hours,
      yLabels: days,
      cells,
      className: 'w-full'
    }
  }, [])

  // 5. SparklineCard Data
  const sparklines: SparklineCardProps[] = [
    {
      title: 'Net Revenue',
      value: '$84,230',
      period: 'Past 7 days',
      trend: 'up',
      trendValue: '+12.5%',
      icon: 'dollar-sign',
      data: [35, 45, 40, 65, 55, 80, 95]
    },
    {
      title: 'Conversion Rate',
      value: '3.42%',
      period: 'Past 7 days',
      trend: 'up',
      trendValue: '+0.8%',
      icon: 'activity',
      data: [20, 25, 30, 42, 50, 48, 62]
    },
    {
      title: 'Customer CAC',
      value: '$42.10',
      period: 'Past 7 days',
      trend: 'down',
      trendValue: '-8.3%',
      icon: 'credit-card',
      data: [60, 55, 52, 48, 44, 40, 38]
    },
    {
      title: '30-Day Retention',
      value: '88.6%',
      period: 'Past 7 days',
      trend: 'up',
      trendValue: '+2.1%',
      icon: 'users',
      data: [75, 78, 80, 82, 84, 86, 88]
    }
  ]

  // 6. DumbbellChart Data
  const dumbbellItems: DumbbellItem[] = [
    {
      label: '/api/v2/checkout',
      before: 480,
      after: 210,
      unit: 'ms',
      displayValue: '56% faster'
    },
    {
      label: '/api/v2/search',
      before: 390,
      after: 180,
      unit: 'ms',
      displayValue: '54% faster'
    },
    {
      label: '/api/v2/auth/verify',
      before: 310,
      after: 140,
      unit: 'ms',
      displayValue: '55% faster'
    },
    {
      label: '/api/v2/recommendations',
      before: 520,
      after: 340,
      unit: 'ms',
      displayValue: '35% faster'
    },
    {
      label: '/api/v2/products/feed',
      before: 260,
      after: 160,
      unit: 'ms',
      displayValue: '38% faster'
    }
  ]
  const dumbbellProps: DumbbellChartProps = {
    title: 'p95 Latency by Endpoint',
    subtitle: 'Response time before and after Rust edge runtime migration',
    beforeLabel: 'Before',
    afterLabel: 'After',
    summaryLabel: 'Median change',
    summaryValue: '39% faster',
    items: dumbbellItems,
    ticks: [0, 150, 300, 450, 600],
    footer: 'Benchmark sampled across 1.4M requests over 48 hours.'
  }

  const activityProps: ActivityCalendarProps = useMemo(
    () => ({
      title: 'Developer Contributions',
      subtitle: '近 26 周提交与发布',
      days: buildDemoActivityDays(),
      footer: 'Includes pull requests, code reviews, and merged commits.'
    }),
    []
  )

  // 8. WaterfallChart Data
  const waterfallSteps: WaterfallStep[] = [
    { label: 'Starting MRR', value: 120, formattedValue: '$120.0k', isTotal: true },
    { label: 'New Business', value: 18.5, formattedValue: '+$18.5k' },
    { label: 'Expansion', value: 9.2, formattedValue: '+$9.2k' },
    { label: 'Contraction', value: -4.1, formattedValue: '-$4.1k' },
    { label: 'Churn', value: -6.8, formattedValue: '-$6.8k' },
    { label: 'Ending MRR', value: 136.8, formattedValue: '$136.8k', isTotal: true }
  ]
  const waterfallProps: WaterfallChartProps = {
    title: 'Net MRR Movement',
    value: '$136.8k',
    trend: 'up',
    trendValue: '+$16.8k (+14%)',
    steps: waterfallSteps,
    footer: 'Net MRR expanded by $16.8k (+14%) during this accounting period.'
  }

  // 9. UptimeCard Data
  const uptimeServices: UptimeServiceItem[] = [
    {
      service: 'API Gateway',
      uptime: '99.98%',
      days: Array.from({ length: 30 }, (_, i) => ({
        status: (i === 14 ? 'degraded' : 'operational') as UptimeStatus,
        date: `Oct ${i + 1}`,
        note: i === 14 ? 'Minor latency spike (degraded)' : '100% operational'
      }))
    },
    {
      service: 'Authentication Service',
      uptime: '99.95%',
      days: Array.from({ length: 30 }, (_, i) => ({
        status: (i === 6 ? 'degraded' : 'operational') as UptimeStatus,
        date: `Oct ${i + 1}`
      }))
    },
    {
      service: 'Payment Processing',
      uptime: '99.82%',
      days: Array.from({ length: 30 }, (_, i) => ({
        status: (i === 21 ? 'outage' : i === 22 ? 'degraded' : 'operational') as UptimeStatus,
        date: `Oct ${i + 1}`,
        note: i === 21 ? 'Upstream provider outage (22m)' : undefined
      }))
    },
    {
      service: 'Search Index Cluster',
      uptime: '99.45%',
      days: Array.from({ length: 30 }, (_, i) => ({
        status: (i === 11 ? 'outage' : 'operational') as UptimeStatus,
        date: `Oct ${i + 1}`
      }))
    },
    {
      service: 'PostgreSQL Primary',
      uptime: '100.00%',
      days: Array.from({ length: 30 }, (_, i) => ({
        status: 'operational' as const,
        date: `Oct ${i + 1}`
      }))
    }
  ]
  const uptimeProps: UptimeCardProps = {
    title: 'Historical System Uptime',
    subtitle: 'Service availability across core cloud microservices over the past 30 days',
    services: uptimeServices,
    footer: 'All services monitored every 60 seconds from 8 global probe locations.'
  }

  // 10. GanttChart Data
  const ganttMetrics: GanttMetric[] = [
    { label: 'Capacity', value: '92%', progress: 92 },
    { label: 'Completion', value: '58%', progress: 58 },
    { label: 'In progress', value: '34%', progress: 34 }
  ]
  const ganttTasks: GanttTaskItem[] = [
    {
      id: '1',
      title: 'Auth v2 migration',
      points: '5 pts',
      status: 'done',
      start: '9',
      end: '12'
    },
    {
      id: '2',
      title: 'Stripe webhook refactor',
      points: '8 pts',
      status: 'in_progress',
      start: '11',
      end: '16'
    },
    {
      id: '3',
      title: 'Role-based permissions API',
      points: '3 pts',
      status: 'in_progress',
      start: '13',
      end: '17'
    },
    {
      id: '4',
      title: 'Billing usage metering',
      points: '5 pts',
      status: 'todo',
      start: '15',
      end: '20'
    }
  ]
  const ganttProps: GanttChartProps = {
    title: 'Sprint 24 Schedule',
    subtitle: 'Oct 9 - Oct 20 · 42 story points committed',
    today: '13',
    metrics: ganttMetrics,
    dates: ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    tasks: ganttTasks,
    footer: '2 blocked tasks require design sign-off by Oct 14.'
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* 顶部调试工具栏 */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
              A2
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">A2UI Component Gallery</h1>
              <p className="text-[11px] text-muted-foreground">zen catalog 可生成组件的视觉沙箱</p>
            </div>
          </div>

          {/* 右侧控制选项 */}
          <div className="flex items-center gap-2">
            {/* 宽度响应式模拟 */}
            <div className="hidden sm:flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewportWidth('full')}
                className={cn(
                  'rounded-md px-2 py-1 font-medium transition-colors',
                  viewportWidth === 'full'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Full
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth('1024')}
                className={cn(
                  'rounded-md px-2 py-1 font-medium transition-colors',
                  viewportWidth === '1024'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                1024px
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth('768')}
                className={cn(
                  'rounded-md px-2 py-1 font-medium transition-colors',
                  viewportWidth === '768'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                768px
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth('420')}
                className={cn(
                  'rounded-md px-2 py-1 font-medium transition-colors',
                  viewportWidth === '420'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                420px
              </button>
            </div>

            {/* 主题切换 */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-1.5"
            >
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              <span>{isDark ? '浅色' : '深色'}</span>
            </Button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 pt-1 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring',
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* 主画布测试区 */}
      <main className="mx-auto py-6 px-4">
        <div
          className={cn(
            'mx-auto transition-all duration-300',
            viewportWidth === 'full' && 'max-w-7xl',
            viewportWidth === '1024' &&
              'max-w-5xl border border-dashed border-border/80 p-4 rounded-2xl',
            viewportWidth === '768' &&
              'max-w-3xl border border-dashed border-border/80 p-4 rounded-2xl',
            viewportWidth === '420' &&
              'max-w-[420px] border border-dashed border-border/80 p-4 rounded-2xl'
          )}
        >
          {/* 0. Agent 真实调用实测 (Agent Runtime E2E) */}
          {activeTab === 'agent-e2e' && <AgentRuntimeSimulator />}

          {activeTab === 'catalog' && <CatalogGallery />}

          {/* 1. 全部概览 (All Overview) */}
          {activeTab === 'all' && (
            <div className="space-y-8">
              {/* StatCards 核心指标 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    1. StatCard (KPI 核心指标)
                  </h2>
                  <Badge variant="outline">Grid columns=4</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {statCardsData.map((stat, i) => (
                    <RenderA2ui key={`stat-${i}`} component={StatCard} props={stat} />
                  ))}
                </div>
              </section>

              {/* SparklineCard 迷你趋势卡片 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    2. SparklineCard (迷你趋势指标卡)
                  </h2>
                  <Badge variant="outline">Grid columns=4</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {sparklines.map((sp, i) => (
                    <RenderA2ui key={`sp-${i}`} component={SparklineCard} props={sp} />
                  ))}
                </div>
              </section>

              {/* BreakdownCard & DonutChart 细分对比 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    3. BreakdownCard & DonutChart (细分结构与环形分布)
                  </h2>
                  <Badge variant="outline">2-Column Grid</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <RenderA2ui component={BreakdownCard} props={breakdownProps} />
                  <RenderA2ui component={DonutChart} props={donutProps} />
                </div>
              </section>

              {/* DumbbellChart & WaterfallChart 变化对比 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    4. DumbbellChart & WaterfallChart (前后对比与净变动)
                  </h2>
                  <Badge variant="outline">Performance & Finance</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <RenderA2ui component={DumbbellChart} props={dumbbellProps} />
                  <RenderA2ui component={WaterfallChart} props={waterfallProps} />
                </div>
              </section>

              {/* HeatmapCard & ActivityCalendar 时间矩阵 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    5. HeatmapCard & ActivityCalendar (时间序列点阵矩阵)
                  </h2>
                  <Badge variant="outline">2-Column Grid</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <RenderA2ui component={HeatmapCard} props={heatmapProps} />
                  <RenderA2ui component={ActivityCalendar} props={activityProps} />
                </div>
              </section>

              {/* UptimeCard 可用性 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    6. UptimeCard (30天多微服务高可用监控)
                  </h2>
                  <Badge variant="outline">SRE Monitoring</Badge>
                </div>
                <RenderA2ui component={UptimeCard} props={uptimeProps} />
              </section>

              {/* GanttChart 敏捷排期 */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    7. GanttChart (Sprint 敏捷冲刺与甘特排期)
                  </h2>
                  <Badge variant="outline">Agile Management</Badge>
                </div>
                <RenderA2ui component={GanttChart} props={ganttProps} />
              </section>

              <CatalogGallery />
            </div>
          )}

          {/* 单组件单独测试视图 */}
          {activeTab === 'stat-card' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">StatCard (KPI 核心指标卡片)</h2>
                <p className="text-xs text-muted-foreground">
                  支持左侧/右侧图标布局、前序对比周期、正负趋势标签以及无缝响应式栅格排列。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCardsData.map((stat, i) => (
                  <RenderA2ui key={`stat-single-${i}`} component={StatCard} props={stat} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'breakdown-card' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">BreakdownCard (收入渠道/细分分布卡片)</h2>
                <p className="text-xs text-muted-foreground">
                  复刻参考图设计：大号核心汇总数据、多段比例进度条、首字母圆角徽标清单、细分子标题与独立趋势标签。
                </p>
              </div>
              <div className="max-w-2xl">
                <RenderA2ui component={BreakdownCard} props={breakdownProps} />
              </div>
            </div>
          )}

          {activeTab === 'donut-chart' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">DonutChart (品类销售占比环形卡片)</h2>
                <p className="text-xs text-muted-foreground">
                  左侧环形图带中心汇总文案，右侧品类占比清单，顶部带有圆角图标容器与正负趋势指示徽章。
                </p>
              </div>
              <div className="max-w-2xl">
                <RenderA2ui component={DonutChart} props={donutProps} />
              </div>
            </div>
          )}

          {activeTab === 'heatmap-card' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">HeatmapCard (流量来源热力图)</h2>
                <p className="text-xs text-muted-foreground">
                  2D 强度矩阵，带 High/Med/Low 图例，圆角胶囊状强度格子，支持悬浮 Tooltip
                  详细数值展示。
                </p>
              </div>
              <div className="max-w-2xl">
                <RenderA2ui component={HeatmapCard} props={heatmapProps} />
              </div>
            </div>
          )}

          {activeTab === 'sparkline-card' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">SparklineCard (迷你趋势指标卡片)</h2>
                <p className="text-xs text-muted-foreground">
                  紧凑型 KPI 卡片，带标题、大号数值、统计周期副标题与底部 7 日迷你柱状趋势走势图。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sparklines.map((sp, i) => (
                  <RenderA2ui key={`sp-single-${i}`} component={SparklineCard} props={sp} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dumbbell-chart' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">DumbbellChart (p95 延迟/前后对比哑铃图)</h2>
                <p className="text-xs text-muted-foreground">
                  横向区间对比图，连接 Before 与 After
                  两点，直观反映性能或指标优化幅度，底部附中位数变动统计。
                </p>
              </div>
              <div className="max-w-3xl">
                <RenderA2ui component={DumbbellChart} props={dumbbellProps} />
              </div>
            </div>
          )}

          {activeTab === 'activity-calendar' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">ActivityCalendar (活动日历点阵图)</h2>
                <p className="text-xs text-muted-foreground">
                  GitHub 风格 26 周热力图，带月份表头、周几表侧、0~4
                  级强度标度、少/多图例与悬浮气泡。
                </p>
              </div>
              <div className="max-w-4xl">
                <RenderA2ui component={ActivityCalendar} props={activityProps} />
              </div>
            </div>
          )}

          {activeTab === 'waterfall-chart' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">WaterfallChart (MRR 净变动瀑布图)</h2>
                <p className="text-xs text-muted-foreground">
                  财务增减瀑布图，支持初始值、中间浮动增减项与最终结算总量柱，精准计算漂浮基准线。
                </p>
              </div>
              <div className="max-w-3xl">
                <RenderA2ui component={WaterfallChart} props={waterfallProps} />
              </div>
            </div>
          )}

          {activeTab === 'uptime-card' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">UptimeCard (30天多微服务高可用监控)</h2>
                <p className="text-xs text-muted-foreground">
                  30
                  日微服务可用性矩阵，每服务独立状态条，支持正常、降级、故障三态视觉与悬浮气泡明细。
                </p>
              </div>
              <div className="max-w-4xl">
                <RenderA2ui component={UptimeCard} props={uptimeProps} />
              </div>
            </div>
          )}

          {activeTab === 'gantt-chart' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold">GanttChart (Sprint 敏捷冲刺与甘特排期)</h2>
                <p className="text-xs text-muted-foreground">
                  顶部容量/完成进度行、左侧任务状态与故事点徽标、右侧排期横条与 Today 标线。
                </p>
              </div>
              <div className="max-w-4xl">
                <RenderA2ui component={GanttChart} props={ganttProps} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
