import { buildDemoActivityDays } from './activity-demo-days'

const demoActivityDays = buildDemoActivityDays()

export interface AgentScenario {
  id: string
  name: string
  badgeLabel: string
  description: string
  userPrompt: string
  agentReply: string
  toolCallId: string
  payload: {
    surfaceId: string
    title: string
    components: Array<{
      id: string
      component: string
      [key: string]: unknown
    }>
  }
}

export const AGENT_SCENARIOS: AgentScenario[] = [
  {
    id: 'all-in-one',
    name: '全景智能大盘 (All 10 Extended Components)',
    badgeLabel: '全栈运维与研发效能大盘',
    description: '模拟 Agent 一次性调用生成包含全部 10 个拓展组件的企业级运维与敏捷研发大盘',
    userPrompt: '请帮我生成本月系统全栈运行监控、研发效能与业务增减的综合看板。',
    agentReply:
      '已为您汇总生成全栈运维监控与研发效能大盘：包含顶层 4 列实时微图指标、Net MRR 净流水与 ARR 统计、渠道与品类构成分析、发布前后接口延迟跃迁、Sprint 甘特排期与 30 天服务可用率矩阵。您可以在右侧画布中查看完整视图并交互。',
    toolCallId: 'call_agent_a2ui_all_in_one',
    payload: {
      surfaceId: 'ops-engineering-dashboard',
      title: '全栈运维与研发效能大盘',
      components: [
        {
          id: 'root',
          component: 'Column',
          gap: 20,
          children: [
            'kpi-grid',
            'financial-grid',
            'business-grid',
            'perf-grid',
            'delivery-grid',
            'calendar-row'
          ]
        },
        // 1. 顶层 4 列 SparklineCard
        {
          id: 'kpi-grid',
          component: 'Grid',
          columns: 4,
          gap: 12,
          children: ['sparkline-req', 'sparkline-users', 'sparkline-errors', 'sparkline-lat']
        },
        {
          id: 'sparkline-req',
          component: 'SparklineCard',
          title: 'API Requests',
          value: '42.8k',
          period: 'this week',
          trend: 'up',
          trendValue: '+14.2%',
          sparkline: [12, 18, 15, 22, 28, 25, 34, 40, 38, 48]
        },
        {
          id: 'sparkline-users',
          component: 'SparklineCard',
          title: 'Active Sessions',
          value: '8,920',
          period: 'this week',
          trend: 'up',
          trendValue: '+8.5%',
          sparkline: [30, 32, 28, 35, 38, 42, 45, 48, 50, 52]
        },
        {
          id: 'sparkline-errors',
          component: 'SparklineCard',
          title: 'Error Rate',
          value: '0.04%',
          period: 'this week',
          trend: 'down',
          trendValue: '-22.1%',
          sparkline: [8, 7, 5, 6, 4, 3, 4, 2, 2, 1]
        },
        {
          id: 'sparkline-lat',
          component: 'SparklineCard',
          title: 'P99 Latency',
          value: '142ms',
          period: 'this week',
          trend: 'down',
          trendValue: '-31.4%',
          sparkline: [220, 210, 195, 180, 175, 160, 155, 148, 145, 142]
        },
        // 2. 核心指标与流水 Grid: StatCard + WaterfallChart
        {
          id: 'financial-grid',
          component: 'Grid',
          columns: 2,
          gap: 16,
          children: ['stat-arr', 'waterfall-mrr']
        },
        {
          id: 'stat-arr',
          component: 'StatCard',
          title: 'Total ARR (年度经常性营收)',
          value: '$1,280,000',
          period: 'FY2026',
          trend: 'up',
          trendValue: '+27.9%',
          previousValue: '$1,004,000',
          previousLabel: 'vs last year',
          description: '企业客户续约率 118%，云原生方案贡献核心增量',
          sparkline: [12, 18, 15, 24, 30, 28, 35, 42, 48, 55]
        },
        {
          id: 'waterfall-mrr',
          component: 'WaterfallChart',
          title: 'Net MRR Movement (月度增减流水)',
          value: '$108,500',
          trend: 'up',
          trendValue: '+14.2%',
          description: '从月初 $95K 起始，净增长 +$13.5K',
          steps: [
            { label: 'Starting MRR', value: 95000, type: 'total' },
            { label: 'New Business', value: 18000, type: 'gain' },
            { label: 'Expansion', value: 6500, type: 'gain' },
            { label: 'Churn', value: -7200, type: 'loss' },
            { label: 'Contraction', value: -3800, type: 'loss' },
            { label: 'Ending MRR', value: 108500, type: 'total' }
          ]
        },
        // 3. 业务渠道与品类: BreakdownCard + DonutChart
        {
          id: 'business-grid',
          component: 'Grid',
          columns: 2,
          gap: 16,
          children: ['breakdown-rev', 'donut-sales']
        },
        {
          id: 'breakdown-rev',
          component: 'BreakdownCard',
          title: 'Revenue Channels (渠道构成与细分)',
          totalValue: '$98,450',
          totalLabel: 'Total Revenue',
          segments: [
            { label: 'Online', value: 58 },
            { label: 'In-Store', value: 26 },
            { label: 'Marketplace', value: 16 }
          ],
          items: [
            {
              label: 'Website Portal',
              initial: 'W',
              value: '4,821',
              trend: 'up',
              trendValue: '18.3%'
            },
            {
              label: 'Mobile Application',
              initial: 'M',
              value: '3,120',
              trend: 'up',
              trendValue: '12.5%'
            },
            {
              label: 'Direct Sales & Enterprise',
              initial: 'D',
              value: '1,840',
              trend: 'down',
              trendValue: '4.2%'
            },
            {
              label: 'Partner API & SDK',
              initial: 'P',
              value: '920',
              trend: 'up',
              trendValue: '8.0%'
            }
          ]
        },
        {
          id: 'donut-sales',
          component: 'DonutChart',
          title: 'Sales by Category (品类营收占比)',
          totalValue: '$254,800',
          totalLabel: 'Total Sales',
          trend: 'up',
          trendValue: '+16.8%',
          description: '硬件设备与配套软件套件占比达 70%',
          categories: [
            { label: 'Cloud Infrastructure', value: 107016, percentage: 42 },
            { label: 'Security & Auth Suite', value: 71344, percentage: 28 },
            { label: 'DevOps Toolchain', value: 45864, percentage: 18 },
            { label: 'Consulting Services', value: 30576, percentage: 12 }
          ]
        },
        // 4. 性能与流量热力: DumbbellChart + HeatmapCard
        {
          id: 'perf-grid',
          component: 'Grid',
          columns: 2,
          gap: 16,
          children: ['dumbbell-perf', 'heatmap-traffic']
        },
        {
          id: 'dumbbell-perf',
          component: 'DumbbellChart',
          title: 'Gateway P95 Latency by Endpoint',
          beforeLabel: 'v1.8 Release',
          afterLabel: 'v1.9 Optimized',
          summaryValue: '39% faster',
          description: 'Rust 网关替换后，核心微服务端点 P95 显著优化',
          items: [
            { label: '/api/v1/auth/token', before: 480, after: 210, unit: 'ms' },
            { label: '/api/v1/orders/checkout', before: 620, after: 340, unit: 'ms' },
            { label: '/api/v1/users/profile', before: 310, after: 160, unit: 'ms' },
            { label: '/api/v1/search/query', before: 850, after: 490, unit: 'ms' },
            { label: '/api/v1/analytics/realtime', before: 920, after: 580, unit: 'ms' }
          ]
        },
        {
          id: 'heatmap-traffic',
          component: 'HeatmapCard',
          title: 'Traffic Sources Intensity Matrix',
          trend: 'up',
          trendValue: '+30%',
          xLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          yLabels: ['Organic', 'Paid Search', 'Direct URL', 'Referral', 'Social Media'],
          cells: [
            { x: 'Week 1', y: 'Organic', intensity: 'high', value: 85 },
            { x: 'Week 2', y: 'Organic', intensity: 'high', value: 92 },
            { x: 'Week 3', y: 'Organic', intensity: 'high', value: 96 },
            { x: 'Week 4', y: 'Organic', intensity: 'high', value: 98 },
            { x: 'Week 1', y: 'Paid Search', intensity: 'medium', value: 55 },
            { x: 'Week 2', y: 'Paid Search', intensity: 'high', value: 82 },
            { x: 'Week 3', y: 'Paid Search', intensity: 'medium', value: 68 },
            { x: 'Week 4', y: 'Paid Search', intensity: 'medium', value: 60 },
            { x: 'Week 1', y: 'Direct URL', intensity: 'medium', value: 65 },
            { x: 'Week 2', y: 'Direct URL', intensity: 'medium', value: 70 },
            { x: 'Week 3', y: 'Direct URL', intensity: 'high', value: 88 },
            { x: 'Week 4', y: 'Direct URL', intensity: 'high', value: 91 },
            { x: 'Week 1', y: 'Referral', intensity: 'low', value: 30 },
            { x: 'Week 2', y: 'Referral', intensity: 'low', value: 35 },
            { x: 'Week 3', y: 'Referral', intensity: 'medium', value: 52 },
            { x: 'Week 4', y: 'Referral', intensity: 'medium', value: 58 },
            { x: 'Week 1', y: 'Social Media', intensity: 'low', value: 20 },
            { x: 'Week 2', y: 'Social Media', intensity: 'low', value: 28 },
            { x: 'Week 3', y: 'Social Media', intensity: 'low', value: 32 },
            { x: 'Week 4', y: 'Social Media', intensity: 'medium', value: 45 }
          ]
        },
        // 5. 敏捷交付与高可用: GanttChart + UptimeCard
        {
          id: 'delivery-grid',
          component: 'Grid',
          columns: 2,
          gap: 16,
          children: ['gantt-sprint', 'uptime-infra']
        },
        {
          id: 'gantt-sprint',
          component: 'GanttChart',
          title: 'Sprint 4 敏捷研发交付排期',
          dates: [
            '1',
            '2',
            '3',
            '4',
            '5',
            '8',
            '9',
            '10',
            '11',
            '12',
            '15',
            '16',
            '17',
            '18',
            '19',
            '22',
            '23',
            '24',
            '25',
            '26'
          ],
          today: '18',
          metrics: [
            { label: 'Capacity', value: '120 pts committed', progress: 100 },
            { label: 'Completion', value: '68 pts done (57%)', progress: 57 },
            { label: 'In progress', value: '36 pts active', progress: 30 }
          ],
          tasks: [
            {
              id: 't-1',
              title: '鉴权与 MFA 升级',
              start: '1',
              end: '10',
              status: 'done',
              points: 13
            },
            {
              id: 't-2',
              title: 'A2UI 组件库扩展落地',
              start: '8',
              end: '22',
              status: 'in-progress',
              points: 21
            },
            {
              id: 't-3',
              title: '智能体工作台实时连接',
              start: '15',
              end: '26',
              status: 'in-progress',
              points: 15
            },
            {
              id: 't-4',
              title: '端到端回归与灰度放量',
              start: '22',
              end: '26',
              status: 'todo',
              points: 8
            }
          ]
        },
        {
          id: 'uptime-infra',
          component: 'UptimeCard',
          title: '核心集群 30 天服务高可用矩阵',
          overallUptime: '99.98%',
          description: '过去 30 天无重大故障，记录 2 次短暂降级',
          services: [
            {
              service: 'API Gateway',
              uptime: '99.99%',
              days: Array.from({ length: 30 }, (_, i) => (i === 18 ? 'degraded' : 'operational'))
            },
            {
              service: 'Auth Center',
              uptime: '100%',
              days: Array.from({ length: 30 }, () => 'operational')
            },
            {
              service: 'Copilot Runtime',
              uptime: '99.95%',
              days: Array.from({ length: 30 }, (_, i) =>
                i === 12 ? 'outage' : i === 13 ? 'degraded' : 'operational'
              )
            },
            {
              service: 'PostgreSQL Cluster',
              uptime: '100%',
              days: Array.from({ length: 30 }, () => 'operational')
            }
          ]
        },
        // 6. 底层团队日历: ActivityCalendar
        {
          id: 'calendar-row',
          component: 'Row',
          align: 'stretch',
          children: ['activity-cal']
        },
        {
          id: 'activity-cal',
          component: 'ActivityCalendar',
          title: '研发交付与代码提交活跃度 (26 周)',
          days: demoActivityDays,
          totalEvents: 1428,
          startDate: '2026-01-01',
          weeks: 26,
          milestones: [
            { date: '2026-01-15', label: 'v1.8 Release' },
            { date: '2026-03-10', label: 'A2UI 协议重构' }
          ]
        }
      ]
    }
  },
  {
    id: 'stat-card',
    name: '1. Agent 调用 StatCard',
    badgeLabel: '核心营收月报 (StatCard)',
    description: '测试 Agent 下发 StatCard 指标卡（带 previousValue、周期对比与迷你走势）',
    userPrompt: '查看本月总营收和增长情况',
    agentReply: '本月总营收为 $128,430，环比上月基准增长 +27.9%，已为您生成可视化指标卡。',
    toolCallId: 'call_agent_stat_card',
    payload: {
      surfaceId: 'agent-stat-card-surface',
      title: '核心营收月报 (StatCard)',
      components: [
        {
          id: 'root',
          component: 'StatCard',
          title: 'Total Revenue',
          value: '$128,430',
          period: 'Last 30 days',
          trend: 'up',
          trendValue: '+27.9%',
          previousValue: '$100,400',
          previousLabel: 'vs last month',
          description: 'Enterprise subscriptions grew significantly across all regions.',
          sparkline: [12, 18, 15, 24, 30, 28, 35, 42, 38, 48]
        }
      ]
    }
  },
  {
    id: 'breakdown-card',
    name: '2. Agent 调用 BreakdownCard',
    badgeLabel: '营收渠道细分 (BreakdownCard)',
    description: '测试 Agent 下发 BreakdownCard（分段比例条 + 渠道徽章明细表）',
    userPrompt: '分析一下当前各大收入渠道的表现与占比',
    agentReply: '当前线上渠道占比达 58%，其中官网与移动端分别保持 18.3% 与 12.5% 的增长。',
    toolCallId: 'call_agent_breakdown_card',
    payload: {
      surfaceId: 'agent-breakdown-card-surface',
      title: '营收渠道细分 (BreakdownCard)',
      components: [
        {
          id: 'root',
          component: 'BreakdownCard',
          title: 'Revenue Channels',
          totalValue: '$98K',
          totalLabel: 'total revenue',
          segments: [
            { label: 'Online', value: 58 },
            { label: 'In-Store', value: 26 },
            { label: 'Marketplace', value: 16 }
          ],
          items: [
            { label: 'Website', initial: 'W', value: '4,821', trend: 'up', trendValue: '18.3%' },
            { label: 'Mobile App', initial: 'M', value: '3,120', trend: 'up', trendValue: '12.5%' },
            {
              label: 'POS Terminal',
              initial: 'P',
              value: '1,840',
              trend: 'down',
              trendValue: '4.2%'
            },
            { label: 'Direct Partner', initial: 'D', value: '920', trend: 'up', trendValue: '8.0%' }
          ]
        }
      ]
    }
  },
  {
    id: 'donut-chart',
    name: '3. Agent 调用 DonutChart',
    badgeLabel: '品类销售结构 (DonutChart)',
    description: '测试 Agent 下发 DonutChart（总计圆心环形图 + 右侧百分比品类明细）',
    userPrompt: '统计各品类产品的销售额占比',
    agentReply: '已为您统计品类销售分布：总销售额 $254,800，云基础设施与安全套件为主要支撑。',
    toolCallId: 'call_agent_donut_chart',
    payload: {
      surfaceId: 'agent-donut-chart-surface',
      title: '品类销售结构 (DonutChart)',
      components: [
        {
          id: 'root',
          component: 'DonutChart',
          title: 'Sales by Category',
          totalValue: '$254,800',
          totalLabel: 'Total Sales',
          trend: 'up',
          trendValue: '+16.8%',
          description: 'Hardware, software, and accessories distribution',
          categories: [
            { label: 'Electronics', value: 107016, percentage: 42 },
            { label: 'Accessories', value: 71344, percentage: 28 },
            { label: 'Software Suite', value: 45864, percentage: 18 },
            { label: 'Consulting', value: 30576, percentage: 12 }
          ]
        }
      ]
    }
  },
  {
    id: 'heatmap-card',
    name: '4. Agent 调用 HeatmapCard',
    badgeLabel: '流量来源矩阵 (HeatmapCard)',
    description: '测试 Agent 下发 HeatmapCard（4 周流量来源热力二维矩阵）',
    userPrompt: '查看近四周流量来源在各周的分布强度',
    agentReply: '自然搜索流量在第 3、4 周显著提升，整体渠道流量环比上升 30%。',
    toolCallId: 'call_agent_heatmap_card',
    payload: {
      surfaceId: 'agent-heatmap-card-surface',
      title: '流量来源矩阵 (HeatmapCard)',
      components: [
        {
          id: 'root',
          component: 'HeatmapCard',
          title: 'Traffic Sources',
          trend: 'up',
          trendValue: '+30%',
          xLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          yLabels: ['6k', '5k', '4k', '2k', '3k', '4.5k'],
          cells: [
            { x: 'Week 1', y: '6k', intensity: 'low', value: 20 },
            { x: 'Week 2', y: '6k', intensity: 'high', value: 90 },
            { x: 'Week 3', y: '6k', intensity: 'high', value: 95 },
            { x: 'Week 4', y: '6k', intensity: 'medium', value: 65 },
            { x: 'Week 1', y: '5k', intensity: 'medium', value: 50 },
            { x: 'Week 2', y: '5k', intensity: 'medium', value: 60 },
            { x: 'Week 3', y: '5k', intensity: 'high', value: 85 },
            { x: 'Week 4', y: '5k', intensity: 'high', value: 92 },
            { x: 'Week 1', y: '4k', intensity: 'none', value: 5 },
            { x: 'Week 2', y: '4k', intensity: 'low', value: 25 },
            { x: 'Week 3', y: '4k', intensity: 'medium', value: 55 },
            { x: 'Week 4', y: '4k', intensity: 'medium', value: 58 }
          ]
        }
      ]
    }
  },
  {
    id: 'sparkline-card',
    name: '5. Agent 调用 SparklineCard',
    badgeLabel: '系统监控四卡微图 (SparklineCard)',
    description: '测试 Agent 下发 4 列并排的 SparklineCard 微型走势卡片',
    userPrompt: '监控系统的 API 调用、并发量、错误率和延迟',
    agentReply: '系统核心指标运转平稳：API 请求量 +14.2%，P99 延迟降至 142ms。',
    toolCallId: 'call_agent_sparkline_card',
    payload: {
      surfaceId: 'agent-sparkline-card-surface',
      title: '系统监控指标 (SparklineCard)',
      components: [
        {
          id: 'root',
          component: 'Grid',
          columns: 4,
          gap: 12,
          children: ['c-req', 'c-sess', 'c-err', 'c-p99']
        },
        {
          id: 'c-req',
          component: 'SparklineCard',
          title: 'Requests',
          value: '42.8k',
          period: 'this week',
          trend: 'up',
          trendValue: '+14.2%',
          sparkline: [12, 18, 15, 22, 28, 25, 34, 40, 38, 48]
        },
        {
          id: 'c-sess',
          component: 'SparklineCard',
          title: 'Sessions',
          value: '8,920',
          period: 'this week',
          trend: 'up',
          trendValue: '+8.5%',
          sparkline: [30, 32, 28, 35, 38, 42, 45, 48, 50, 52]
        },
        {
          id: 'c-err',
          component: 'SparklineCard',
          title: 'Errors',
          value: '0.04%',
          period: 'this week',
          trend: 'down',
          trendValue: '-22.1%',
          sparkline: [8, 7, 5, 6, 4, 3, 4, 2, 2, 1]
        },
        {
          id: 'c-p99',
          component: 'SparklineCard',
          title: 'P99 Latency',
          value: '142ms',
          period: 'this week',
          trend: 'down',
          trendValue: '-31.4%',
          sparkline: [220, 210, 195, 180, 175, 160, 155, 148, 145, 142]
        }
      ]
    }
  },
  {
    id: 'dumbbell-chart',
    name: '6. Agent 调用 DumbbellChart',
    badgeLabel: '接口性能优化对比 (DumbbellChart)',
    description: '测试 Agent 下发 DumbbellChart（棒铃水平连接条对比优化前后延迟）',
    userPrompt: '对比新旧版本发布后各端点 P95 延迟的变化',
    agentReply: '优化后整体延迟中位数提升 39% faster，核心鉴权与下单端点耗时大幅缩减。',
    toolCallId: 'call_agent_dumbbell_chart',
    payload: {
      surfaceId: 'agent-dumbbell-chart-surface',
      title: '接口性能对比 (DumbbellChart)',
      components: [
        {
          id: 'root',
          component: 'DumbbellChart',
          title: 'p95 latency by endpoint',
          beforeLabel: 'Before optimization',
          afterLabel: 'After optimization',
          summaryValue: '39% faster',
          description: 'Latency reduction across 5 critical REST API endpoints',
          items: [
            { label: '/api/v1/auth/token', before: 480, after: 210, unit: 'ms' },
            { label: '/api/v1/orders/checkout', before: 620, after: 340, unit: 'ms' },
            { label: '/api/v1/users/profile', before: 310, after: 160, unit: 'ms' },
            { label: '/api/v1/search/query', before: 850, after: 490, unit: 'ms' },
            { label: '/api/v1/analytics/realtime', before: 920, after: 580, unit: 'ms' }
          ]
        }
      ]
    }
  },
  {
    id: 'activity-calendar',
    name: '7. Agent 调用 ActivityCalendar',
    badgeLabel: '研发提交活跃度 (ActivityCalendar)',
    description: '测试 Agent 下发 ActivityCalendar（26周日历圆点活跃度矩阵）',
    userPrompt: '展示研发团队上半年的代码提交和发布活跃日历',
    agentReply: '上半年累计产生 1,428 次代码提交与构建发布，已生成活跃度热力图。',
    toolCallId: 'call_agent_activity_calendar',
    payload: {
      surfaceId: 'agent-activity-calendar-surface',
      title: '研发提交日历 (ActivityCalendar)',
      components: [
        {
          id: 'root',
          component: 'ActivityCalendar',
          title: 'Team Commit & Deploy Activity',
          days: demoActivityDays,
          totalEvents: 1428,
          startDate: '2026-01-01',
          weeks: 26,
          milestones: [
            { date: '2026-01-15', label: 'v1.8 Release' },
            { date: '2026-03-10', label: 'A2UI Engine' }
          ]
        }
      ]
    }
  },
  {
    id: 'waterfall-chart',
    name: '8. Agent 调用 WaterfallChart',
    badgeLabel: 'Net MRR 流水变动 (WaterfallChart)',
    description: '测试 Agent 下发 WaterfallChart（财务增减瀑布图流转分析）',
    userPrompt: '核算本月月度经常性收入 (MRR) 的增减过程',
    agentReply: 'Net MRR 从月初 $95K 起始，净增长 +$13.5K 至 $108.5K，已生成增减瀑布图。',
    toolCallId: 'call_agent_waterfall_chart',
    payload: {
      surfaceId: 'agent-waterfall-chart-surface',
      title: 'Net MRR Movement (WaterfallChart)',
      components: [
        {
          id: 'root',
          component: 'WaterfallChart',
          title: 'Net MRR movement',
          value: '$108,500',
          trend: 'up',
          trendValue: '+14.2%',
          description: 'From starting balance to ending MRR after churn and expansion',
          steps: [
            { label: 'Starting MRR', value: 95000, type: 'total' },
            { label: 'New business', value: 18000, type: 'gain' },
            { label: 'Expansion', value: 6500, type: 'gain' },
            { label: 'Churn', value: -7200, type: 'loss' },
            { label: 'Contraction', value: -3800, type: 'loss' },
            { label: 'Ending MRR', value: 108500, type: 'total' }
          ]
        }
      ]
    }
  },
  {
    id: 'uptime-card',
    name: '9. Agent 调用 UptimeCard',
    badgeLabel: '30天服务可用率网格 (UptimeCard)',
    description: '测试 Agent 下发 UptimeCard（30天微服务高可用状态矩阵）',
    userPrompt: '检查各微服务过去 30 天的高可用率',
    agentReply: '集群综合高可用率 99.98%，仅 Copilot Runtime 记录 1 次短暂故障和 1 次降级。',
    toolCallId: 'call_agent_uptime_card',
    payload: {
      surfaceId: 'agent-uptime-card-surface',
      title: '核心微服务可用率 (UptimeCard)',
      components: [
        {
          id: 'root',
          component: 'UptimeCard',
          title: 'Historical uptime',
          days: 30,
          overallUptime: '99.98%',
          description: '30-day reliability matrix across core microservices',
          services: [
            {
              service: 'API Gateway',
              uptime: '99.99%',
              days: Array.from({ length: 30 }, (_, i) => (i === 18 ? 'degraded' : 'operational'))
            },
            {
              service: 'Auth Center',
              uptime: '100%',
              days: Array.from({ length: 30 }, () => 'operational')
            },
            {
              service: 'Copilot Runtime',
              uptime: '99.95%',
              days: Array.from({ length: 30 }, (_, i) =>
                i === 12 ? 'outage' : i === 13 ? 'degraded' : 'operational'
              )
            },
            {
              service: 'PostgreSQL Database',
              uptime: '100%',
              days: Array.from({ length: 30 }, () => 'operational')
            }
          ]
        }
      ]
    }
  },
  {
    id: 'gantt-chart',
    name: '10. Agent 调用 GanttChart',
    badgeLabel: 'Sprint 敏捷甘特排期 (GanttChart)',
    description: '测试 Agent 下发 GanttChart（三段式容量/完成进度 + 今日基准线）',
    userPrompt: '生成当前 Sprint 的敏捷研发甘特排期与交付状态',
    agentReply: 'Sprint 4 进展顺利：总容量 120 点，已交付 68 点，36 点进行中。',
    toolCallId: 'call_agent_gantt_chart',
    payload: {
      surfaceId: 'agent-gantt-chart-surface',
      title: 'Sprint 4 排期 (GanttChart)',
      components: [
        {
          id: 'root',
          component: 'GanttChart',
          title: 'Sprint 4 敏捷交付排期',
          dates: [
            '1',
            '2',
            '3',
            '4',
            '5',
            '8',
            '9',
            '10',
            '11',
            '12',
            '15',
            '16',
            '17',
            '18',
            '19',
            '22',
            '23',
            '24',
            '25',
            '26'
          ],
          today: '18',
          metrics: [
            { label: 'Capacity', value: '120 pts committed', progress: 100 },
            { label: 'Completion', value: '68 pts done (57%)', progress: 57 },
            { label: 'In progress', value: '36 pts active', progress: 30 }
          ],
          tasks: [
            {
              id: 't-1',
              title: '鉴权与 MFA 升级',
              start: '1',
              end: '10',
              status: 'done',
              points: 13
            },
            {
              id: 't-2',
              title: 'A2UI 组件库扩展落地',
              start: '8',
              end: '22',
              status: 'in-progress',
              points: 21
            },
            {
              id: 't-3',
              title: '智能体工作台实时连接',
              start: '15',
              end: '26',
              status: 'in-progress',
              points: 15
            },
            {
              id: 't-4',
              title: '端到端回归与灰度放量',
              start: '22',
              end: '26',
              status: 'todo',
              points: 8
            }
          ]
        }
      ]
    }
  }
]
