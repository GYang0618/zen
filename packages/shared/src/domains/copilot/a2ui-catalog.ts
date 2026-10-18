import { z } from 'zod'

/** 与前端 `createCatalog({ catalogId })` 对齐；catalog 由 host 持有，模型不得自选。 */
export const ZEN_A2UI_CATALOG_ID = 'copilotkit://zen-catalog'

const chartDataItemSchema = z.object({
  label: z.string().describe('分类标签或时间点'),
  value: z.number().describe('对应数值')
})

const chartPropsSchema = z.object({
  title: z.string().optional().describe('图表标题，如“营收概览”；组件已自带单层卡片，请尽量提供'),
  description: z
    .string()
    .optional()
    .describe('可选说明；仅当有必要补充上下文时填写，标题已足够时请省略，勿每个图表都写'),
  data: z.array(chartDataItemSchema).optional().describe('图表数据项列表；缺省时渲染为空图')
})

const horizontalBarChartPropsSchema = z.object({
  title: z.string().optional().describe('图表标题，如“Top 10 销售人员排行”'),
  description: z.string().optional().describe('可选说明'),
  data: z.array(chartDataItemSchema).optional().describe('数据列表'),
  sorted: z.enum(['asc', 'desc', 'none']).optional().describe('是否对数据自动排序，默认 none'),
  showValues: z.boolean().optional().describe('是否在条形尾部直接展示具体数值，默认 true'),
  valueUnit: z.string().optional().describe('数值单位后缀，如“人”、“万元”、“ms”')
})

const chartSeriesDefSchema = z.object({
  key: z.string().describe('数据字段键名，如“online”或“budget”'),
  label: z.string().describe('图例与悬浮提示展示的名称，如“线上渠道”或“预算”')
})

const multiSeriesChartPropsSchema = z.object({
  title: z.string().optional().describe('图表标题'),
  description: z.string().optional().describe('可选说明'),
  series: z.array(chartSeriesDefSchema).describe('多个数据系列定义，至少包含 key 与 label'),
  data: z
    .array(z.record(z.string(), z.union([z.string(), z.number()])))
    .describe('数据项列表，每项需包含 label（分类/时序）以及对应 series 的各个 key 数值'),
  showLegend: z.boolean().optional().describe('是否显示底部图例，默认 true')
})

const stackedBarChartPropsSchema = multiSeriesChartPropsSchema.extend({
  layout: z
    .enum(['vertical', 'horizontal'])
    .optional()
    .describe('柱状方向：vertical 纵向堆叠，horizontal 横向堆叠，默认 vertical')
})

const multiLineChartPropsSchema = multiSeriesChartPropsSchema.extend({
  curve: z
    .enum(['monotone', 'linear', 'step'])
    .optional()
    .describe('折线弯曲类型：monotone 平滑，linear 直线，step 阶梯，默认 monotone'),
  showDots: z.boolean().optional().describe('是否展示数据圆点，默认 false')
})

const stackedAreaChartPropsSchema = multiSeriesChartPropsSchema.extend({
  curve: z
    .enum(['monotone', 'linear'])
    .optional()
    .describe('面积曲线类型：monotone 平滑，linear 直线，默认 monotone')
})

const composedChartPropsSchema = z.object({
  title: z.string().optional().describe('图表标题，如“营收与环比增长”'),
  description: z.string().optional().describe('可选说明'),
  data: z
    .array(
      z.object({
        label: z.string().describe('X 轴分类或时间'),
        barValue: z.number().describe('柱状图对应数值（通常为绝对量，如订单量、营收）'),
        lineValue: z.number().describe('折线图对应数值（通常为比率或次级指标，如增长率、客单价）')
      })
    )
    .describe('混合图表数据列表'),
  barLabel: z.string().optional().describe('柱状系列名称，默认“数值”'),
  lineLabel: z.string().optional().describe('折线系列名称，默认“比率”'),
  barUnit: z.string().optional().describe('柱状系列数值单位，如“万”或“笔”'),
  lineUnit: z.string().optional().describe('折线系列数值单位，如“%”'),
  secondaryAxis: z.boolean().optional().describe('是否启用双 Y 轴（柱在左、折线在右），默认 true')
})

const gaugeChartPropsSchema = z.object({
  title: z.string().optional().describe('仪表标题，如“季度目标达成率”或“CPU 负载”'),
  description: z.string().optional().describe('可选说明'),
  value: z.number().describe('当前数值，如 78.5'),
  max: z.number().optional().describe('最大量程，默认 100'),
  min: z.number().optional().describe('最小量程，默认 0'),
  unit: z.string().optional().describe('数值单位，如“%”、“分”、“ms”，默认“%”'),
  subtext: z.string().optional().describe('仪表盘下方说明文案，如“达标”或“较上周 +4.2%”'),
  status: z
    .enum(['default', 'success', 'warning', 'destructive'])
    .optional()
    .describe('状态色彩模式，默认 default（使用主题色），亦可显式指定预警状态')
})

const funnelChartPropsSchema = z.object({
  title: z.string().optional().describe('漏斗标题，如“用户注册与转化漏斗”'),
  description: z.string().optional().describe('可选说明'),
  data: z.array(chartDataItemSchema).describe('漏斗阶段数据，按流程先后从上到下排列'),
  showConversionRate: z.boolean().optional().describe('是否展示相邻阶段转化率，默认 true'),
  unit: z.string().optional().describe('数值单位后缀，如“人”、“单”')
})

const scatterChartPropsSchema = z.object({
  title: z.string().optional().describe('散点图标题，如“客户价值与活跃度分布”'),
  description: z.string().optional().describe('可选说明'),
  data: z
    .array(
      z.object({
        x: z.number().describe('X 轴数值'),
        y: z.number().describe('Y 轴数值'),
        z: z.number().optional().describe('气泡大小参考值'),
        label: z.string().optional().describe('数据点名称/标签'),
        category: z.string().optional().describe('分组分类名称')
      })
    )
    .describe('散点坐标数据列表'),
  xAxisLabel: z.string().optional().describe('X 轴名称说明，如“活跃天数”'),
  yAxisLabel: z.string().optional().describe('Y 轴名称说明，如“客单价”'),
  xAxisUnit: z.string().optional().describe('X 轴单位，如“天”'),
  yAxisUnit: z.string().optional().describe('Y 轴单位，如“元”')
})

const donutChartPropsSchema = z.object({
  title: z.string().optional().describe('环形图标题，如“Sales by Category”或“销售品类分布”'),
  description: z.string().optional().describe('可选说明'),
  icon: z.string().optional().describe('标题前置图标名，如 pie-chart 或 clock'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('指标增长或变化趋势'),
  trendValue: z.string().optional().describe('趋势文案，如“+8.4% vs last month”'),
  centerLabel: z.string().optional().describe('圆环中心下方/上方的标题，如“Total”或“总计”'),
  centerValue: z
    .union([z.string(), z.number()])
    .optional()
    .describe('圆环中心大号数值，如“$250K”；缺省时自动计算 data 的 value 总和'),
  showLegend: z.boolean().optional().describe('是否显示图例，默认 true'),
  layout: z
    .enum(['side-by-side', 'stacked'])
    .optional()
    .describe('布局模式：side-by-side 左环右表（默认，如销售品类卡片），stacked 上下图表居中'),
  showActionMenu: z.boolean().optional().describe('是否展示右上角操作菜单（...），默认 true'),
  data: z
    .array(
      z.object({
        label: z.string().describe('分类标签，如“Electronics”'),
        value: z.number().describe('数值，如 145000'),
        formattedValue: z.string().optional().describe('格式化金额或文本，如“$145K”'),
        percentage: z
          .union([z.string(), z.number()])
          .optional()
          .describe('占比百分比，如“58%”或 58'),
        color: z.string().optional().describe('自定义颜色')
      })
    )
    .optional()
    .describe('分类数据项列表')
})

const statCardPropsSchema = z.object({
  title: z.string().describe('指标标题，如“Monthly revenue”或“总营收”'),
  value: z.string().describe('当前指标数值，如“$189,540.75”'),
  description: z.string().optional().describe('底部说明，如“较上月增长 20.1%”'),
  icon: z
    .string()
    .optional()
    .describe('图标名称：dollar, users, creditCard, activity 或任意 Lucide 图标名'),
  iconPosition: z
    .enum(['left', 'right'])
    .optional()
    .describe('图标位置：left 为标题同行前置（如月营收卡片），right 为右上角（默认）'),
  trend: z
    .enum(['up', 'down', 'neutral'])
    .optional()
    .describe('指标变化趋势，影响说明文字与箭头方向'),
  trendValue: z.string().optional().describe('趋势变化值，如“+27.9%”'),
  trendLabel: z.string().optional().describe('趋势后缀标签，如“vs last month”'),
  previousValue: z.string().optional().describe('上一周期基准数值，如“$148,230.00”'),
  previousLabel: z.string().optional().describe('上一周期标签，如“previous month”'),
  period: z.string().optional().describe('时间周期说明，如“this week”'),
  sparkline: z
    .array(
      z.union([
        z.number().describe('数值'),
        z.object({
          value: z.number().describe('数值'),
          label: z.string().optional().describe('时序标签')
        })
      ])
    )
    .optional()
    .describe('底部微型走势图数据列表（如 [12, 18, 15, 24, ...]），渲染为迷你柱状图')
})

const breakdownCardPropsSchema = z.object({
  title: z.string().describe('卡片标题，如“Revenue Channels”'),
  icon: z.string().optional().describe('标题前置图标名，如 users, layers, git-branch'),
  totalValue: z.string().optional().describe('总指标大号数值，如“$98K”'),
  totalLabel: z.string().optional().describe('总指标说明文案，如“total revenue”'),
  segments: z
    .array(
      z.object({
        label: z.string().describe('分段标签，如“Online”'),
        value: z.number().describe('分段数值，用于计算各段比例'),
        color: z.string().optional().describe('分段色彩类名或自定义颜色')
      })
    )
    .optional()
    .describe('分段条形图系列（如渠道占比 Online / In-Store / Marketplace）'),
  items: z
    .array(
      z.object({
        id: z.string().optional().describe('唯一标识'),
        label: z.string().describe('渠道/明细名称，如“Website”'),
        initial: z.string().optional().describe('头像缩写首字母，如“W”；缺省时取 label 首字母'),
        icon: z.string().optional().describe('前置图标名（优先级高于 initial）'),
        avatar: z.string().optional().describe('头像图片地址 URL'),
        value: z
          .union([z.string(), z.number()])
          .describe('对应数值或格式化文本，如 4821 或“4,821”'),
        trend: z
          .enum(['up', 'down', 'neutral'])
          .optional()
          .describe('趋势方向：up 增长(绿色)，down 下跌(红色)'),
        trendValue: z.string().optional().describe('趋势百分比或变化量，如“18.3%”'),
        secondaryValue: z.string().optional().describe('辅助次要说明')
      })
    )
    .describe('渠道或细分条目列表'),
  columns: z
    .object({
      channelLabel: z.string().optional().describe('第一列标题，默认“Channels”'),
      valueLabel: z.string().optional().describe('第二列标题，默认“Number”'),
      trendLabel: z.string().optional().describe('第三列标题，默认“Total”')
    })
    .optional()
    .describe('自定义表头列文案')
})

const heatmapCardPropsSchema = z.object({
  title: z.string().describe('卡片标题，如“Traffic Sources”'),
  icon: z.string().optional().describe('标题图标名，如 grid, network, activity'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('整体趋势'),
  trendValue: z.string().optional().describe('右上角变化标签，如“+30%”'),
  xLabels: z
    .array(z.string())
    .describe('X 轴列标签列表，如 [“Week 1”, “Week 2”, “Week 3”, “Week 4”]'),
  yLabels: z
    .array(z.string())
    .describe('Y 轴行标签列表，如 [“6k”, “5k”, “4k”, “2k”, “3k”, “4.5k”]'),
  cells: z
    .array(
      z.object({
        x: z.union([z.string(), z.number()]).describe('对应列标签名或列索引'),
        y: z.union([z.string(), z.number()]).describe('对应行标签名或行索引'),
        intensity: z
          .union([z.enum(['high', 'medium', 'low', 'none']), z.number()])
          .optional()
          .describe(
            '热力强度等级：high（深黑/高亮）、medium（中灰）、low（浅灰）、none（无），或 0-100 数值'
          ),
        value: z.union([z.string(), z.number()]).optional().describe('单元格数值'),
        tooltip: z
          .object({
            title: z.string().optional().describe('悬浮提示第一行，如“Email”'),
            subtitle: z.string().optional().describe('悬浮提示第二行，如“Week 1”'),
            value: z.string().optional().describe('悬浮提示第三行高亮值，如“45%”')
          })
          .optional()
          .describe('悬浮提示详情')
      })
    )
    .describe('矩阵单元格数据列表'),
  legend: z
    .array(
      z.object({
        label: z.string().describe('图例文案，如“High”'),
        intensity: z.enum(['high', 'medium', 'low', 'none']).describe('对应强度等级')
      })
    )
    .optional()
    .describe('自定义热力图例，缺省为 High/Medium/Low')
})

const sparklineCardPropsSchema = z.object({
  title: z.string().describe('指标名称，如“API calls”或“Active users”'),
  value: z.string().describe('当前指标大号数值，如“118k”或“189 ms”'),
  period: z.string().optional().describe('时间周期说明，如“this week”'),
  data: z
    .array(
      z.union([
        z.number().describe('数值'),
        z.object({
          value: z.number().describe('数值'),
          label: z.string().optional().describe('时序节点或标签，如“周一”')
        })
      ])
    )
    .optional()
    .describe('走势微图数据点（如最近 7 天或 8 个时间段数据）'),
  type: z
    .enum(['bar', 'line'])
    .optional()
    .describe('微图类型：bar 迷你柱状图（默认），line 迷你折线图'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('变化趋势'),
  trendValue: z.string().optional().describe('趋势百分比，如“+12.4%”'),
  icon: z.string().optional().describe('右上角图标')
})

const dumbbellChartPropsSchema = z.object({
  title: z.string().describe('图表标题，如“p95 latency by endpoint”'),
  subtitle: z
    .string()
    .optional()
    .describe('副标题，如“Before and after the Jun 4 edge cache release”'),
  summaryLabel: z.string().optional().describe('右上角概览标签，如“Median change”'),
  summaryValue: z.string().optional().describe('右上角概览数值，如“39% faster”'),
  beforeLabel: z.string().optional().describe('变动前图例文案，如“Before, May 28”'),
  afterLabel: z.string().optional().describe('变动后图例文案，如“After, Jun 4”'),
  items: z
    .array(
      z.object({
        label: z.string().describe('端点或条目名称，如“POST /v1/checkout”'),
        before: z.number().describe('变动前数值，如 480'),
        after: z.number().describe('变动后数值，如 210'),
        unit: z.string().optional().describe('单项单位，如“ms”'),
        displayValue: z.string().optional().describe('右侧自定义对比文案，如“480 → 210 ms”')
      })
    )
    .describe('对比条目列表'),
  min: z.number().optional().describe('X 轴刻度起始值，默认 0'),
  max: z.number().optional().describe('X 轴刻度最大值，缺省自动计算'),
  unit: z.string().optional().describe('全局单位，默认“ms”'),
  ticks: z
    .array(z.number())
    .optional()
    .describe('自定义 X 轴刻度点列表，如 [0, 175, 350, 525, 700]'),
  footer: z.string().optional().describe('底部备注说明文案')
})

const activityCalendarPropsSchema = z.object({
  title: z.string().describe('日历标题，如“Activity calendar”'),
  subtitle: z.string().optional().describe('副标题，如“Daily event count, Jan to Jun 2026”'),
  months: z
    .array(z.string())
    .optional()
    .describe('顶部月份标题列表，如 [“Jan”, “Feb”, “Mar”, “Apr”, “May”, “Jun”]'),
  days: z
    .array(
      z.object({
        date: z.string().describe('日期，如“2026-04-14”'),
        count: z.number().optional().describe('事件数量'),
        level: z
          .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
          .optional()
          .describe('活动强度等级 0-4（0 最浅，4 最黑）'),
        tooltip: z.string().optional().describe('悬浮提示文案')
      })
    )
    .optional()
    .describe('每日活动数据列表，缺省时自动展示标准 26 周示例活动矩阵'),
  footer: z.string().optional().describe('底部说明，如标注最暗活跃日或版本发布事件')
})

const waterfallChartPropsSchema = z.object({
  title: z.string().describe('图表标题，如“Net MRR movement, June”'),
  value: z.string().optional().describe('主指标大号数值，如“$48,210”'),
  trendValue: z.string().optional().describe('增长或变化趋势文案，如“+$2,090 vs May”'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('趋势方向'),
  baseline: z.number().optional().describe('坐标轴起始基准值，如 40000（使细微变动更易读）'),
  max: z.number().optional().describe('坐标轴上限最大值'),
  steps: z
    .array(
      z.object({
        label: z
          .string()
          .describe('步骤名称，如“Starting MRR”、“New business”、“Churn”、“Ending MRR”'),
        value: z.number().describe('变动数值（正数为收益，负数为损失；总额步骤为绝对值）'),
        formattedValue: z
          .string()
          .optional()
          .describe('右侧展示的格式化数值，如“+$2,480”或“$46,120”'),
        isTotal: z
          .boolean()
          .optional()
          .describe('是否为总额条（如起始 MRR 和期末 MRR），默认 false')
      })
    )
    .describe('瀑布变动步骤列表'),
  legend: z
    .object({
      totalLabel: z.string().optional().describe('总计标签，默认“Total”'),
      gainLabel: z.string().optional().describe('收益标签，默认“Gain”'),
      lossLabel: z.string().optional().describe('损失标签，默认“Loss”')
    })
    .optional(),
  footer: z.string().optional().describe('底部备注说明文案')
})

const uptimeCardPropsSchema = z.object({
  title: z.string().describe('卡片标题，如“Historical uptime”'),
  subtitle: z
    .string()
    .optional()
    .describe('副标题，如“30-day per-service reliability grid for the Acme platform”'),
  dateLabels: z
    .array(z.string())
    .optional()
    .describe('表头 30 天日期数字刻度列表，如 [“14”, “15”, ... “12”]'),
  services: z
    .array(
      z.object({
        service: z.string().describe('服务名称，如“API”、“Dashboard”、“Webhooks”、“CDN”'),
        uptime: z.string().optional().describe('可用率百分比，如“99.98%”'),
        days: z
          .array(
            z.union([
              z.enum(['operational', 'degraded', 'outage']),
              z.object({
                status: z
                  .enum(['operational', 'degraded', 'outage'])
                  .describe('状态：operational(浅灰正常), degraded(中灰降级), outage(深黑故障)'),
                date: z.string().optional().describe('日期标注'),
                note: z.string().optional().describe('详细说明')
              })
            ])
          )
          .describe('每日状态列表（共 30 项）')
      })
    )
    .describe('服务状态行列表'),
  legend: z
    .object({
      operationalLabel: z.string().optional().describe('正常标签，默认“Operational”'),
      degradedLabel: z.string().optional().describe('降级标签，默认“Degraded”'),
      outageLabel: z.string().optional().describe('故障标签，默认“Outage”')
    })
    .optional(),
  footer: z.string().optional().describe('底部备注说明')
})

const ganttChartPropsSchema = z.object({
  title: z.string().optional().describe('甘特图标题，如“Sprint 14 敏捷冲刺排期”'),
  subtitle: z.string().optional().describe('副标题说明'),
  metrics: z
    .array(
      z.object({
        label: z.string().describe('指标名称，如“Capacity”、“Completion”、“In progress”'),
        value: z.string().describe('指标数值文本，如“36 / 40 pts committed”、“8 pts done (22%)”'),
        progress: z.number().describe('进度百分比 (0-100)')
      })
    )
    .optional()
    .describe('顶部进度汇总卡（容量、完成度、进行中点数）'),
  dates: z
    .array(z.string())
    .describe(
      '时间刻度日期列标签列表，如 [“9”, “10”, “11”, “12”, “13”, “16”, “17”, “18”, “19”, “20”]'
    ),
  today: z
    .string()
    .optional()
    .describe('当前日期标识，用于在对应列居中垂直高亮“今日指示线”，如“13”'),
  tasks: z
    .array(
      z.object({
        id: z.string().optional().describe('任务唯一标识'),
        title: z.string().describe('任务名称，如“API key rotation UI”'),
        status: z
          .enum(['done', 'in_progress', 'todo'])
          .optional()
          .describe('状态：done(已完成中灰)、in_progress(进行中深黑)、todo(待办浅灰)'),
        statusLabel: z
          .string()
          .optional()
          .describe('状态显示文案，如“Done”、“In progress”、“To do”'),
        points: z.union([z.string(), z.number()]).optional().describe('任务估算点数，如 5 或“5pt”'),
        start: z.union([z.string(), z.number()]).describe('排期开始日期，对应 dates 中的标签'),
        end: z.union([z.string(), z.number()]).describe('排期结束日期，对应 dates 中的标签'),
        color: z.string().optional().describe('自定义排期条背景颜色')
      })
    )
    .describe('任务列表与排期起止'),
  footer: z
    .string()
    .optional()
    .describe(
      '底部备注说明，如“Day numbers shown. Today is Jun 13. Bars reflect planned duration, not hours logged.”'
    )
})

/**
 * 平台无关的 A2UI catalog 定义（Zod + description）。
 * Web 侧交给 `createCatalog`，Runtime 侧交给 `a2ui.schema`。
 */
export const zenA2uiCatalogDefinitions = {
  Row: {
    description:
      '横向弹性布局容器，适合并排 KPI（StatCard）。多图等高网格请优先用 Grid；本组件子项已 stretch，卡片需 h-full 才视觉等高。',
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
  Grid: {
    description:
      'CSS Grid 多列布局：同一行内子卡片默认等高。多图仪表盘（如 2×2 图表）请优先用本组件，勿用多层 Row 拼网格。',
    props: z.object({
      children: z.array(z.string()).describe('子组件 ID 列表，按行优先顺序排布'),
      columns: z.number().int().min(1).max(4).optional().describe('列数，默认 2，取值 1–4'),
      gap: z.number().optional().describe('格子间距（像素），默认 12')
    })
  },
  DashboardCard: {
    description:
      '通用卡片容器（标题 + 可选副标题 + child）。仅用于包裹无自带卡片的内容；禁止再包裹 StatCard / Metric / 各类 Chart（它们已自带单层卡片，再包会双层嵌套）。',
    props: z.object({
      title: z.string().describe('卡片主标题'),
      subtitle: z.string().optional().describe('卡片副标题或说明'),
      child: z.string().optional().describe('子组件 ID')
    })
  },
  StatCard: {
    description:
      '运营统计卡片：标题 + 可选图标 + 大号数值 + 底部说明，适合顶栏 KPI（如总营收、订阅用户）。支持上一周期对比基准（previousValue/previousLabel）、时间周期（period）及底部微型柱状走势（sparkline）。',
    props: statCardPropsSchema
  },
  SparklineCard: {
    description:
      '微型走势统计卡片（自带单层卡片）：标题 + 大号指标数值 + 时间周期 + 底部迷你柱状走势（Mini Sparkline），最适合在 Grid(columns=4) 中并排排布系统监控指标（如 API 调用数、活跃用户数、错误数、p99 延迟等）。直接挂在 Grid/Row/Column 下。',
    props: sparklineCardPropsSchema
  },
  BreakdownCard: {
    description:
      '渠道分布/细分绩效卡片（自带单层卡片）：支持总额指标展示、分段条形比例条（Segmented Bar）、图例及带首字母圆点徽章的渠道指标列表（渠道名、具体数量、增长/下降百分比趋势）。适合营收渠道构成（Revenue Channels）、流量来源渠道分解等。直接挂在 Grid/Row/Column 下。',
    props: breakdownCardPropsSchema
  },
  HeatmapCard: {
    description:
      '热力矩阵/流量来源矩阵卡片（自带单层卡片）：二维行列矩阵（如 Y 轴渠道/分段，X 轴时间周/月份），单元格采用圆角药丸条展示强度等级（High 深黑/Medium 中灰/Low 浅灰），支持鼠标悬浮气泡查看明细（来源、时段、占比）。适合流量来源（Traffic Sources）、访问时段热力分布。直接挂在 Grid/Row/Column 下。',
    props: heatmapCardPropsSchema
  },
  DumbbellChart: {
    description:
      '棒铃图/区间对比图（自带单层卡片）：水平连接条展示发布/变动前后数值变化（如 Before vs After），圆点标示前后取值，右侧直接展示数值跃迁（如 480 → 210 ms），右上角支持中位数变动汇总（如 39% faster）。适合多端点性能对比（p95 latency by endpoint）、策略上线前后效果对比。直接挂在 Grid/Row/Column 下。',
    props: dumbbellChartPropsSchema
  },
  ActivityCalendar: {
    description:
      '活动日历图/贡献热力矩阵（自带单层卡片）：仿 GitHub 活跃度矩阵，顶部月份标签（Jan–Jun），左侧星期标签（Mon/Wed/Fri），圆点阵列展示每日事件量级阶梯（0–4级色阶），支持鼠标悬浮查看具体日期与事件数，底部带 Less/More 色阶图例与里程碑事件说明。适合系统每日调用量、操作审计活跃度。直接挂在 Grid/Row/Column 下。',
    props: activityCalendarPropsSchema
  },
  WaterfallChart: {
    description:
      '瀑布流图/财务增减流水变动卡片（自带单层卡片）：大号主指标与环比增长，通过浮动横向色块清晰展示从期初值经各项正向收益（Gain）、负向损失（Loss/Churn）到期末总额（Total）的流转过程。适合月度经常性收入变动（Net MRR movement）、资产/用户增减损益分析。直接挂在 Grid/Row/Column 下。',
    props: waterfallChartPropsSchema
  },
  UptimeCard: {
    description:
      '服务历史可用率状态网格卡片（自带单层卡片）：展示多个核心服务最近 30 天每日运行可靠性，顶部带 30 天数字刻度，每个服务一行 30 颗圆角胶囊块（Operational 正常/Degraded 性能降级/Outage 故障），支持鼠标悬浮提示与右侧整体可用率百分比（如 99.98%）。适合平台服务稳定性监控大盘（Historical uptime）。直接挂在 Grid/Row/Column 下。',
    props: uptimeCardPropsSchema
  },
  Metric: {
    description:
      '兼容旧版的 KPI 指标卡（内部渲染为 StatCard）。新界面请优先使用 StatCard（title/description/icon）。',
    props: z.object({
      label: z.string().describe('指标名称'),
      value: z.string().describe('当前指标数值'),
      description: z.string().optional().describe('底部说明文字'),
      icon: z.enum(['dollar', 'users', 'creditCard', 'activity']).optional().describe('右上角图标'),
      trend: z.enum(['up', 'down', 'neutral']).optional().describe('指标变化趋势'),
      trendValue: z.string().optional().describe('趋势变化具体百分比或数值')
    })
  },
  AreaChart: {
    description:
      '单系列面积图（自带单层卡片：标题 + 可选描述 + 渐变面积图）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  BarChart: {
    description:
      '单系列垂直柱状图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  HorizontalBarChart: {
    description:
      '横向柱状图/条形图（自带单层卡片）。最适合 Top N 排名、排行榜、长标签分类展示，支持直接在条形右侧标注数值与单位。直接挂在 Grid/Row/Column 下。',
    props: horizontalBarChartPropsSchema
  },
  GroupedBarChart: {
    description:
      '分组/对比柱状图（自带单层卡片）。适合同维度下多系列横向对比（如实际 vs 预算、各季度多渠道对比）。直接挂在 Grid/Row/Column 下。',
    props: multiSeriesChartPropsSchema
  },
  StackedBarChart: {
    description:
      '堆叠柱状图（自带单层卡片）。适合总量及内部各部分构成占比分析（如总工单按严重级别堆叠），支持纵向或横向堆叠。直接挂在 Grid/Row/Column 下。',
    props: stackedBarChartPropsSchema
  },
  LineChart: {
    description:
      '单系列折线图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  MultiLineChart: {
    description:
      '多折线走势图（自带单层卡片）。适合多个指标的时序走势同屏对比（如日活/周活/月活、多环境响应时间曲线）。直接挂在 Grid/Row/Column 下。',
    props: multiLineChartPropsSchema
  },
  StackedAreaChart: {
    description:
      '堆叠面积图（自带单层卡片）。带平滑渐变填充，适合累积总量随时间的演化趋势与各分类占比分析。直接挂在 Grid/Row/Column 下。',
    props: stackedAreaChartPropsSchema
  },
  ComposedChart: {
    description:
      '柱折复合双轴图（自带单层卡片）。经典商业分析图表：左 Y 轴柱状图表示绝对数量（如营收、订单），右 Y 轴折线图表示比率或增速（如环比增速、利润率）。直接挂在 Grid/Row/Column 下。',
    props: composedChartPropsSchema
  },
  PieChart: {
    description:
      '饼图/环形图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  DonutChart: {
    description:
      '指标环形图/分类销售卡片（自带单层卡片）。结构占比分析，支持左侧厚环形图（圆心突出展示总额与 Total 标签）+ 右侧分类明细列表（颜色圆点、分类名、格式化金额与占比百分比），支持右上角操作菜单与环比增长标签。适合品类销售构成（Sales by Category）、费用预算分布等。直接挂在 Grid/Row/Column 下。',
    props: donutChartPropsSchema
  },
  RadarChart: {
    description:
      '雷达图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  RadialChart: {
    description:
      '径向条形图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  GaugeChart: {
    description:
      '半圆仪表盘（自带单层卡片）。适合展示核心 KPI 达成率、资源配额使用率（如 CPU/内存）、健康度评分或安全指数，带进度弧与居中大号数值。直接挂在 Grid/Row/Column 下。',
    props: gaugeChartPropsSchema
  },
  FunnelChart: {
    description:
      '漏斗转化图（自带单层卡片）。适合营销获客、销售阶段推进、招聘流转、用户注册转化等阶段流失与转化率分析，底部自带转化率统计卡片。直接挂在 Grid/Row/Column 下。',
    props: funnelChartPropsSchema
  },
  GanttChart: {
    description:
      '甘特图/敏捷冲刺排期卡片（自带单层卡片）：顶部支持三段式进度汇总（Capacity 容量、Completion 完成度、In progress 进行中），日期时间刻度横轴，任务行包含任务名、状态胶囊（Done/In progress/To do）与故事点数，排期横条支持按状态着色，并带有垂直贯穿的今日基准线（Today Marker Line）。适合研发项目计划、Sprint 冲刺进度追踪、跨团队交付排期。直接挂在 Grid/Row/Column 下。',
    props: ganttChartPropsSchema
  },
  ScatterChart: {
    description:
      '散点分布图（自带单层卡片）。适合双变量相关性分析与四象限聚类（如活跃天数 vs 客单价、并发量 vs 响应延迟）。直接挂在 Grid/Row/Column 下。',
    props: scatterChartPropsSchema
  },
  DataTable: {
    description:
      '通用数据表格组件，支持多列定义、复合字段合并（图标/头像+标题+副标题）、状态标签、头像组、带图标数值展示及表头交互排序。',
    props: z.object({
      title: z.string().optional().describe('表格标题'),
      description: z.string().optional().describe('表格描述'),
      columns: z
        .array(
          z.object({
            key: z.string().describe('列数据键名'),
            header: z.string().describe('列标题文案'),
            sortable: z.boolean().optional().describe('是否支持点击表头排序，默认 true'),
            align: z.enum(['left', 'center', 'right']).optional().describe('文本对齐方式'),
            cellType: z
              .enum([
                'text',
                'composite',
                'badge',
                'tag',
                'avatar',
                'avatarGroup',
                'iconText',
                'progress',
                'date',
                'icon'
              ])
              .optional()
              .describe(
                '单元格特殊渲染类型：composite(复合多字段：图标/头像+标题+副标题)、avatarGroup(成员头像组+数量)、iconText(图标+文本/计数)、tag/badge(状态胶囊标签)、avatar(单头像)、text(普通文本)'
              ),
            subtitleKey: z
              .string()
              .optional()
              .describe('复合列副标题/描述的数据键名（如 code/username）'),
            iconKey: z.string().optional().describe('动态图标名的数据键名'),
            icon: z.string().optional().describe('固定图标名，如 crown, user, shieldCheck, key'),
            iconColorKey: z.string().optional().describe('图标背景主题色键名'),
            iconColor: z
              .string()
              .optional()
              .describe('固定图标颜色主题，如 emerald, sky, amber, slate, rose, indigo'),
            avatarKey: z.string().optional().describe('头像地址的数据键名'),
            badgeVariantMap: z
              .record(z.string(), z.string())
              .optional()
              .describe('标签状态对应变体或色彩映射')
          })
        )
        .describe('列配置列表'),
      data: z.array(z.record(z.string(), z.unknown())).describe('表格数据项列表'),
      enableSorting: z.boolean().optional().describe('是否全局开启表头排序'),
      emptyMessage: z.string().optional().describe('空数据时的提示文案')
    })
  },
  Icon: {
    description:
      'Lucide 动态图标组件，支持传入任意 Lucide 图标名称如 user, shield, activity, briefcase 等。',
    props: z.object({
      name: z.string().describe('Lucide 图标名（kebab-case 或 camelCase）'),
      size: z.union([z.number(), z.string()]).optional().describe('图标尺寸'),
      className: z.string().optional().describe('额外的 Tailwind 类名'),
      color: z.string().optional().describe('自定义颜色')
    })
  },
  Timeline: {
    description:
      '时间线展示组件，适用于活动动态、操作记录、审批流程、历史演进等。支持多种视觉模式（空心点 dot、实心彩色点 solid-dot、图标 icon、人员头像 avatar、日期分组 groups），请根据业务场景灵活选择，避免千篇一律：\n' +
      '- 极简事件流 / 历史足迹：使用 variant="dot"（默认空心点，简洁高级）\n' +
      '- 状态流转 / 告警与监控：使用 variant="solid-dot" 或在 item 中指定 status（success/warning/error/info）\n' +
      '- 人事变动 / 团队操作记录：使用 variant="avatar" 并在 item 中传入 avatar 或 name\n' +
      '- 系统功能 / 多类目操作流：使用 variant="icon" 并在 item 中传入 icon（如 user-plus, briefcase 等）\n' +
      '- 跨日期 / 跨阶段长流：传入 groups（如按日期「2026年8月18日」分组），自动渲染组间断开的分组时间线',
    props: z.object({
      variant: z
        .enum(['auto', 'dot', 'solid-dot', 'icon', 'avatar'])
        .optional()
        .describe(
          '时间线整体风格模式：dot（默认极简空心点）、solid-dot（实心彩色点）、icon（图标节点）、avatar（用户头像节点）、auto（根据条目字段自动推导）'
        ),
      items: z
        .array(
          z.object({
            title: z.string().describe('节点主标题'),
            description: z.string().optional().describe('节点内容或详细描述'),
            timestamp: z
              .string()
              .optional()
              .describe('时间戳文字，如「10:01」或「2026-08-18 10:01」'),
            status: z
              .enum(['default', 'success', 'warning', 'error', 'info'])
              .optional()
              .describe('状态颜色主题'),
            icon: z.string().optional().describe('Lucide 图标名，如 user-plus, briefcase 等'),
            iconColor: z.string().optional().describe('图标自定义颜色类名'),
            iconBg: z.string().optional().describe('图标背景类名'),
            avatar: z
              .union([
                z.string().describe('头像图片地址 URL'),
                z.object({
                  src: z.string().optional().describe('头像图片地址'),
                  name: z.string().optional().describe('用户名称，用于 fallback'),
                  fallback: z.string().optional().describe('显式 fallback 文本')
                })
              ])
              .optional()
              .describe('头像配置（适用于 avatar 模式或人员变动流）'),
            side: z
              .string()
              .optional()
              .describe('左侧辅助说明，如类别「岗位」「成员」或具体时间「09:30」'),
            group: z.string().optional().describe('所属分组标题，如「2026年8月18日」'),
            variant: z
              .enum(['auto', 'dot', 'solid-dot', 'icon', 'avatar'])
              .optional()
              .describe('单项覆盖节点风格'),
            changes: z
              .array(
                z.object({
                  label: z.string().describe('变更字段标签'),
                  from: z.string().nullable().optional().describe('变更前值'),
                  to: z.string().nullable().optional().describe('变更后值')
                })
              )
              .optional()
              .describe('字段变更对比'),
            actions: z
              .array(
                z.object({
                  label: z.string().describe('操作按钮文案'),
                  variant: z.enum(['default', 'secondary', 'outline', 'ghost']).optional()
                })
              )
              .optional()
              .describe('底部轻量操作按钮')
          })
        )
        .optional()
        .describe('扁平时间线节点列表（若条目带 group，会自动归组）'),
      groups: z
        .array(
          z.object({
            group: z.string().describe('分组标题，如按日期「2026年8月18日」或阶段名称「阶段一」'),
            items: z
              .array(
                z.object({
                  title: z.string().describe('节点主标题'),
                  description: z.string().optional().describe('节点内容或详细描述'),
                  timestamp: z.string().optional().describe('时间戳文字'),
                  status: z
                    .enum(['default', 'success', 'warning', 'error', 'info'])
                    .optional()
                    .describe('状态颜色主题'),
                  icon: z.string().optional().describe('Lucide 图标名'),
                  iconColor: z.string().optional().describe('图标颜色类名'),
                  iconBg: z.string().optional().describe('图标背景类名'),
                  avatar: z
                    .union([
                      z.string(),
                      z.object({
                        src: z.string().optional(),
                        name: z.string().optional(),
                        fallback: z.string().optional()
                      })
                    ])
                    .optional(),
                  side: z.string().optional().describe('左侧辅助说明'),
                  variant: z.enum(['auto', 'dot', 'solid-dot', 'icon', 'avatar']).optional(),
                  changes: z
                    .array(
                      z.object({
                        label: z.string(),
                        from: z.string().nullable().optional(),
                        to: z.string().nullable().optional()
                      })
                    )
                    .optional(),
                  actions: z
                    .array(
                      z.object({
                        label: z.string(),
                        variant: z.enum(['default', 'secondary', 'outline', 'ghost']).optional()
                      })
                    )
                    .optional()
                })
              )
              .describe('组内时间线节点列表')
          })
        )
        .optional()
        .describe('分组模式时间线（按组断开连线），适合多天或多阶段活动记录'),
      className: z.string().optional()
    })
  },
  Avatar: {
    description: '纯展示型头像组件，支持图片 URL、名称缩写 fallback 及可选的状态角标。',
    props: z.object({
      src: z.string().optional().describe('头像图片地址'),
      name: z.string().optional().describe('用户名称，用于计算 fallback 首字母'),
      fallback: z.string().optional().describe('显式 fallback 文本'),
      size: z.enum(['sm', 'default', 'lg']).optional().describe('头像大小尺寸'),
      badge: z.union([z.string(), z.boolean()]).optional().describe('角标内容或是否展示角标圆点'),
      className: z.string().optional()
    })
  },
  Badge: {
    description: '徽章标签组件，用于状态标识、属性归类等轻量标记。',
    props: z.object({
      text: z.string().describe('徽章文字内容'),
      variant: z
        .enum(['default', 'secondary', 'destructive', 'outline', 'ghost'])
        .optional()
        .describe('徽章样式变体'),
      icon: z.string().optional().describe('前置图标名'),
      className: z.string().optional()
    })
  },
  ScrollArea: {
    description: '滚动条容器组件，用于限定高度并提供平滑滚动条，可包裹列表等内容。',
    props: z.object({
      children: z.array(z.string()).describe('子组件 ID 列表'),
      maxHeight: z
        .union([z.number(), z.string()])
        .optional()
        .describe('最大高度（数字为 px，或合法的 CSS 尺寸字符串）'),
      scrollbars: z.enum(['vertical', 'horizontal', 'both', 'none']).optional(),
      className: z.string().optional()
    })
  },
  Tabs: {
    description: '纯展示型标签页组件，支持点击 Tab 标签在不同子内容视图之间切换展示。',
    props: z.object({
      items: z
        .array(
          z.object({
            key: z.string().describe('Tab 唯一键'),
            label: z.string().describe('Tab 标签显示文本'),
            icon: z.string().optional().describe('Tab 标签图标'),
            child: z.string().optional().describe('该 Tab 下挂载的子组件 ID')
          })
        )
        .describe('Tab 项列表'),
      defaultValue: z.string().optional().describe('默认选中的 Tab key'),
      className: z.string().optional()
    })
  },
  Progress: {
    description: '进度条组件，用于展示任务完成度、配额占比、健康指标等百分比数值。',
    props: z.object({
      value: z.number().min(0).max(100).describe('进度百分比 (0-100)'),
      max: z.number().optional().describe('最大值，默认 100'),
      label: z.string().optional().describe('进度条标签标题'),
      showValue: z.boolean().optional().describe('是否在右侧展示数值百分比'),
      className: z.string().optional()
    })
  },
  Item: {
    description: '列表条目展示组件，适合在仪表盘排布信息流、操作记录、团队成员小条目等。',
    props: z.object({
      title: z.string().describe('条目标题'),
      description: z.string().optional().describe('条目副标题或详细描述'),
      icon: z.string().optional().describe('前置图标名'),
      avatar: z.string().optional().describe('前置头像 URL'),
      badge: z.string().optional().describe('右侧徽章文本'),
      extra: z.string().optional().describe('右侧辅助文本或时间'),
      variant: z.enum(['default', 'outline', 'muted']).optional(),
      className: z.string().optional()
    })
  },
  ItemGroup: {
    description: '列表条目分组容器，用于包裹多个 Item 子项。',
    props: z.object({
      children: z.array(z.string()).describe('子组件 ID 列表'),
      className: z.string().optional()
    })
  },
  UserCard: {
    description:
      '用户实体展示卡片，遵循系统用户卡片 UI，展示头像、姓名、账号、状态、部门岗位与角色。',
    props: z.object({
      user: z.object({
        id: z.string(),
        username: z.string(),
        nickname: z.string().nullable().optional(),
        realName: z.string().nullable().optional(),
        avatar: z.string().nullable().optional(),
        email: z.string().optional(),
        phoneNumber: z.string().nullable().optional(),
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        roles: z
          .array(
            z.object({
              id: z.string(),
              code: z.string(),
              name: z.string(),
              icon: z.string().nullable().optional(),
              iconColor: z.string().nullable().optional()
            })
          )
          .optional(),
        departmentName: z.string().optional(),
        postName: z.string().optional()
      })
    })
  },
  RoleCard: {
    description:
      '角色实体展示卡片，遵循系统角色卡片 UI，展示角色图标、颜色、状态、成员数与权限统计。',
    props: z.object({
      role: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        iconColor: z.string().nullable().optional(),
        status: z.enum(['active', 'disabled']).optional(),
        effectiveStatus: z.enum(['active', 'disabled', 'expired', 'locked']).optional(),
        kind: z.enum(['system', 'custom']).optional(),
        memberCount: z.number().optional(),
        permissionCount: z.number().optional(),
        isSystem: z.boolean().optional()
      })
    })
  },
  PostCard: {
    description:
      '岗位实体展示卡片，遵循系统岗位卡片 UI，展示岗位图标、职级、状态、编码与在编人数。',
    props: z.object({
      item: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        level: z.enum(['P5', 'P6', 'P7', 'P8']).optional(),
        status: z.enum(['active', 'disabled']).optional(),
        icon: z.string().nullable().optional(),
        iconColor: z.string().nullable().optional(),
        activeCount: z.number().optional(),
        frozenCount: z.number().optional(),
        organizationCount: z.number().optional()
      })
    })
  },
  OrganizationCard: {
    description: '组织实体展示卡片，展示组织名称、编码、类型徽章、负责人信息与编制/成员统计。',
    props: z.object({
      organization: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        type: z.string(),
        parentId: z.string().nullable().optional(),
        leader: z
          .object({
            id: z.string(),
            name: z.string(),
            title: z.string().nullable().optional(),
            avatar: z.string().nullable().optional()
          })
          .nullable()
          .optional(),
        memberCount: z.number().optional(),
        positionCount: z.number().optional(),
        effectiveDate: z.string().optional()
      })
    })
  }
}

export type ZenA2uiCatalogDefinitions = typeof zenA2uiCatalogDefinitions

/** CopilotKit Runtime `a2ui.schema` 所需的 v0.9 inline catalog。 */
export interface ZenA2uiInlineCatalog {
  catalogId: string
  components: Record<string, Record<string, unknown>>
}

export function getZenA2uiInlineCatalog(): ZenA2uiInlineCatalog {
  const components: Record<string, Record<string, unknown>> = {}

  for (const [name, definition] of Object.entries(zenA2uiCatalogDefinitions)) {
    const jsonSchema = z.toJSONSchema(definition.props)
    components[name] = {
      ...jsonSchema,
      description: definition.description
    }
  }

  return {
    catalogId: ZEN_A2UI_CATALOG_ID,
    components
  }
}

export const ZEN_A2UI_COMPOSITION_GUIDE = `
调用 render_a2ui 时使用官方参数（不要自行拼 createSurface / updateComponents）：
- surfaceId: 新界面用稳定短横线 id（如 "ops-overview"）；更新已有界面时复用同一 id
- title: 必填短中文标题，概括本次界面用途（如「系统运营报表」），供对话徽章与工作区标签展示；按用户需求动态撰写，不要用「生成式界面」这类空泛名
- components: 扁平组件数组。每项必须有 id、component，属性平铺在对象上（不要再包一层 props）
- data: 可选，写入 Surface 数据模型的纯 JSON（表单预填、path 绑定）

自定义组件列表：
- 布局与容器：Row、Column、Grid、DashboardCard、ScrollArea、Tabs
- KPI与信息卡片：
  * StatCard（运营统计卡片：标题、大号数值、图标、增长趋势，支持上一周期基准 previousValue/previousLabel、周期 period 与底部微型柱状走势 sparkline）
  * SparklineCard（紧凑型微图指标卡：标题、数值、周期说明如 this week、底部 8-10 根垂直柱微走势，适合 4 卡等宽并排展示系统监控指标）
  * BreakdownCard（渠道分布/绩效卡片：总额数值、分段比例条 Segmented Bar、图例、带首字母圆圈徽章的各渠道数量与涨跌幅表格）
  * HeatmapCard（流量来源/时段热力矩阵：二维行列药丸条、High/Medium/Low 强度色阶、鼠标悬浮展示来源+周次+占比浮层）
  * DumbbellChart（棒铃对比图：水平横杠连接 Before/After 点位、右侧跃迁文案如 480 → 210 ms、右上角中位数汇总，适合接口延迟对比或上线前后评测）
  * ActivityCalendar（活动日历图：仿 GitHub 26周每日圆点活跃度矩阵、月份/星期标签、Less/More 色阶、悬浮日期与事件数）
  * WaterfallChart（财务增减瀑布图：主指标+浮动条块展示 Starting MRR -> New business -> Churn -> Ending MRR 流水变动，Total/Gain/Loss 色阶）
  * UptimeCard（30天服务可用率网格：顶部 30 天刻度数字，各服务一行 30 颗胶囊状态块 Operational/Degraded/Outage、右侧整体可用率如 99.98%）
  * GanttChart（敏捷排期甘特图：顶部三段式进度汇总容量/完成度/进行中、今日指示竖线 Today Marker Line、任务状态胶囊与故事点数、排期横条，适合 Sprint 冲刺与项目交付计划）
  * Metric、Progress、Item、ItemGroup、UserCard、RoleCard、PostCard、OrganizationCard
- 列表与表格：DataTable、Timeline、Avatar、Badge、Icon
- 统计图表库（自带单层卡片）：
  * 单指标常规：AreaChart（单系列面积）、BarChart（单系列垂直柱状）、LineChart（单系列折线）、PieChart（基础饼图）、RadarChart（雷达图）、RadialChart（径向条形）
  * 排行与长标签：HorizontalBarChart（横向条形图，支持 auto 排序、条形末端直接显示数值与单位）
  * 多系列对比：GroupedBarChart（并排分组柱状，如计划 vs 实际）、StackedBarChart（堆叠构成分析，支持横纵向）
  * 多指标趋势：MultiLineChart（多折线同时刻走势，支持 smooth/step）、StackedAreaChart（堆叠面积渐变）
  * 商业双轴混合：ComposedChart（柱折混合图：左 Y 轴为绝对量柱、右 Y 轴为比率/增速折线）
  * 仪表盘计量：GaugeChart（半圆环形仪表盘，居中大号数值 + 进度弧，展示达成率、健康分、配额使用率）
  * 漏斗转化：FunnelChart（阶段转化与留存流失分析，底部自动输出阶段流失率）
  * 散点分布：ScatterChart（双变量相关性、四象限聚类）
  * 环形指标：DonutChart（中心展示总计/核心指标 + 右侧品类明细列表、格式化金额与占比百分比的横向卡片）
基础组件（basic catalog）：Text、Button、Card、List、Image、TextField 等

组装与图表选型规则：
1. 必须有 id="root" 的根节点，优先用 Column / Row / Grid 做布局
2. 用 children / child 引用其它组件 id；id 在同一 surface 内唯一，禁止自引用
3. StatCard / SparklineCard / BreakdownCard / HeatmapCard / DumbbellChart / ActivityCalendar / WaterfallChart / UptimeCard / GanttChart / 各类 Chart 组件已自带单层卡片：直接挂到 Grid/Row/Column，禁止再包 DashboardCard 或 basic Card（否则双层嵌套）
4. 多图并排或 2×2 仪表盘：用 Grid（columns=2），不要用多层 Row 拼网格；同一行卡片会自动等高
5. 顶栏 KPI 或系统监控指标行：
   - 4 个微型指标（如 API 调用量、活跃用户、错误数、p99 延迟）：用 Grid(columns=4) 包裹 4 个 SparklineCard
   - 营收月报/核心 KPI：用 StatCard，传 previousValue/previousLabel 显示上月基准与 +27.9% 环比增长
   - 渠道构成与细分：用 BreakdownCard 展示 $98K 渠道占比条与各渠道转化明细
   - 品类销售结构：用 DonutChart 展示 $250K 总额与 Electronics、Accessories、Software、Other 明细
   - 流量来源矩阵/时段热力：用 HeatmapCard 展示 Week 1-4 与各来源阶梯分布
   - 变动前后/优化效果比对（如 p95 延迟）：用 DumbbellChart 展示端点发布前后跃迁
   - 日历活跃度/年度提交/日志密度：用 ActivityCalendar 展示 26 周每日密度
   - 收入变动/资金池进出流水：用 WaterfallChart 展示 MRR 增减过程
   - 平台稳定性监控大盘：用 UptimeCard 展示 30 天各微服务状态网格
   - 研发项目冲刺排期/交付甘特：用 GanttChart 展示任务起止与今日基准线
6. 根据分析场景精准选择最匹配的统计图表类型，避免千篇一律的单一柱状图：
   - 排名排行榜（Top 5/10）、长名称分类（部门名、API 路由）：优先用 HorizontalBarChart
   - 实际 vs 预算、同期对比：优先用 GroupedBarChart
   - 包含成分比例的累加量：优先用 StackedBarChart 或 StackedAreaChart
   - 多个关键时序指标同屏对比：优先用 MultiLineChart
   - 「销售量 + 增长率」或「工单量 + 解决率」：优先用 ComposedChart（柱折双轴）
   - KPI 达成率、资源配额使用率、健康分：优先用 GaugeChart
   - 用户注册、商机流转、招聘流程转化：优先用 FunnelChart
   - 占比与总计：优先用 DonutChart
   - 发布前后优化对比：优先用 DumbbellChart
   - 增减流水核算：优先用 WaterfallChart
   - 服务可用性追踪：优先用 UptimeCard
   - 敏捷排期与项目计划：优先用 GanttChart
   - 审计 API 访问统计（响应含 trend、byCaller、topRoutes）：用 GaugeChart 展示总体 errorRate；用 ComposedChart 展示 trend 中 requestCount（柱）与 errorRate（折线，先乘 100 转百分数）；用 DonutChart 展示 byCaller 占比；用 HorizontalBarChart 展示 topRoutes 调用量或错误数排行。仪表盘至少采用两种不同的图表类型，避免重复表达同一指标。
   - 审计操作统计：byAction / byResource 用 HorizontalBarChart 展示排行，byResult / byActorType 用 DonutChart 展示构成；不要把不同维度拼成没有共同含义的系列。
   - 登录统计：trend 有数据时用 LineChart 展示每日登录量；successRate 用 GaugeChart；byEvent 用 DonutChart。没有 trend 字段时，不得伪造时间序列。
   - 趋势规则：只有接口明确返回按时间分桶的数据时才使用折线、面积、热力或活动日历；只有同一分类含多个可比数值系列时才使用分组/堆叠图。缺少支撑维度时选用排行、构成、KPI 与表格，不生成示例或估算数据。
7. 图表组件自身的 title 尽量填写；description 仅在需要补充上下文时填写，标题已足够则省略；不要传 color，配色由主题 token 自动决定
8. Timeline 时间线支持丰富模式（请避免千篇一律只用同一种带圆圈图标的风格）：
   - 跨多天/多阶段活动记录优先使用 groups 分组模式（按日期「2026年X月X日」断开连线，组头连组内）
   - 用户操作/团队动态优先用 variant="avatar" 人员头像节点模式
   - 状态追踪/审批进度优先用 variant="solid-dot" 实心彩色点或 variant="dot" 极简空心点
   - 多类型业务动作流可用 variant="icon" 配合 side 分类列（如「岗位」「成员」「组织」）
`.trim()
