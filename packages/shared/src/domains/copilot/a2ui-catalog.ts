import { z } from 'zod'

/** 与前端 `createCatalog({ catalogId })` 对齐；catalog 由 host 持有，模型不得自选。 */
export const ZEN_A2UI_CATALOG_ID = 'copilotkit://zen-catalog'

const chartDataItemSchema = z.object({
  label: z.string().describe('分类标签或时间点'),
  value: z.number().describe('对应数值')
})

const chartPropsSchema = z.object({
  title: z
    .string()
    .optional()
    .describe('图表标题，概括这张图在比较或展示什么；组件已自带单层卡片，请尽量提供'),
  description: z
    .string()
    .optional()
    .describe('可选说明；仅当有必要补充上下文时填写，标题已足够时请省略，勿每个图表都写'),
  data: z.array(chartDataItemSchema).optional().describe('图表数据项列表；缺省时渲染为空图')
})

const horizontalBarChartPropsSchema = z.object({
  title: z.string().optional().describe('图表标题，概括被比较的分类'),
  description: z.string().optional().describe('可选说明；标题已足够时省略'),
  data: z.array(chartDataItemSchema).optional().describe('分类及其数值'),
  sorted: z.enum(['asc', 'desc', 'none']).optional().describe('是否对数据自动排序，默认 none'),
  showValues: z.boolean().optional().describe('是否在条形尾部直接展示具体数值，默认 true'),
  valueUnit: z.string().optional().describe('数值单位后缀，如“人”、“次”、“ms”')
})

const chartSeriesDefSchema = z.object({
  key: z.string().describe('数据字段键名，必须与 data 中的数值字段一致'),
  label: z.string().describe('图例与悬浮提示中的系列名称')
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
  title: z.string().optional().describe('图表标题，点明柱与折线各自表示的指标'),
  description: z.string().optional().describe('可选说明；标题已足够时省略'),
  data: z
    .array(
      z.object({
        label: z.string().describe('共用的分类或有序轴标签，柱与折线必须对齐到同一 label'),
        barValue: z.number().describe('柱状系列数值，使用绝对量或主指标'),
        lineValue: z.number().describe('折线系列数值，使用另一量纲，如比率或速率')
      })
    )
    .describe('同一分类轴上的两组不同量纲数值'),
  barLabel: z.string().optional().describe('柱状系列名称，默认“数值”'),
  lineLabel: z.string().optional().describe('折线系列名称，默认“比率”'),
  barUnit: z.string().optional().describe('柱状系列单位，如“次”或“人”'),
  lineUnit: z.string().optional().describe('折线系列单位，如“%”'),
  secondaryAxis: z
    .boolean()
    .optional()
    .describe('是否分左右轴（柱在左、折线在右）。两个系列量纲不同时保持默认 true')
})

const gaugeChartPropsSchema = z.object({
  title: z.string().optional().describe('仪表标题，说明这一个比率或进度代表什么'),
  description: z.string().optional().describe('可选说明；标题已足够时省略'),
  value: z.number().describe('当前值，应落在 min 与 max 之间'),
  max: z.number().optional().describe('最大量程，默认 100'),
  min: z.number().optional().describe('最小量程，默认 0'),
  unit: z.string().optional().describe('数值单位，默认“%”'),
  subtext: z.string().optional().describe('仪表下方的短说明，如相对基准的变化；没有就省略'),
  status: z
    .enum(['default', 'success', 'warning', 'destructive'])
    .optional()
    .describe('状态色彩模式，默认 default（使用主题色），亦可显式指定预警状态')
})

const funnelChartPropsSchema = z.object({
  title: z.string().optional().describe('漏斗标题，说明这组有序阶段'),
  description: z.string().optional().describe('可选说明；标题已足够时省略'),
  data: z
    .array(chartDataItemSchema)
    .describe('阶段数据。必须按流程先后排列，后一阶段应是前一阶段的子集，不要按数值重排'),
  showConversionRate: z.boolean().optional().describe('是否展示相邻阶段转化率，默认 true'),
  unit: z.string().optional().describe('数值单位后缀，如“人”或“次”')
})

const scatterChartPropsSchema = z.object({
  title: z.string().optional().describe('散点图标题，说明两个变量之间要看的关系'),
  description: z.string().optional().describe('可选说明；标题已足够时省略'),
  data: z
    .array(
      z.object({
        x: z.number().describe('横轴连续数值'),
        y: z.number().describe('纵轴连续数值，必须与 x 来自同一批对象'),
        z: z.number().optional().describe('可选的第三维，映射点的大小；没有大小含义时省略'),
        label: z.string().optional().describe('点的名称。点很多时省略，避免标签重叠'),
        category: z.string().optional().describe('可选分组，用于区分点的类别')
      })
    )
    .describe('同一批对象上的两个连续变量'),
  xAxisLabel: z.string().optional().describe('横轴含义'),
  yAxisLabel: z.string().optional().describe('纵轴含义'),
  xAxisUnit: z.string().optional().describe('横轴单位'),
  yAxisUnit: z.string().optional().describe('纵轴单位')
})

const donutChartPropsSchema = z.object({
  title: z
    .string()
    .optional()
    .describe('环形图标题，说明这个整体由哪些分类构成。必须填写，缺省为「分类占比」'),
  description: z.string().optional().describe('可选说明；标题已足够时省略'),
  icon: z.string().optional().describe('标题前置图标名，如 pie-chart'),
  trend: z
    .enum(['up', 'down', 'neutral'])
    .optional()
    .describe('整体相对基准的方向；没有可比基准时省略'),
  trendValue: z.string().optional().describe('趋势文案，写明相对哪个基准变了多少'),
  centerLabel: z
    .string()
    .optional()
    .describe('中心合计的名称，如“合计”。缺省为合计，请按数据含义填写'),
  centerValue: z
    .union([z.string(), z.number()])
    .optional()
    .describe('中心合计的展示值；缺省时用各项 value 之和'),
  showLegend: z.boolean().optional().describe('是否显示图例，默认 true'),
  layout: z
    .enum(['side-by-side', 'stacked'])
    .optional()
    .describe('布局：side-by-side 为环与明细并排（默认），stacked 为上下排列'),
  showActionMenu: z.boolean().optional().describe('是否展示右上角操作菜单，默认 true'),
  data: z
    .array(
      z.object({
        label: z.string().describe('分类名称'),
        value: z.number().describe('该分类的数值。各项应互斥，且能加总为同一个整体'),
        formattedValue: z.string().optional().describe('该项的展示文案；缺省时界面使用 value'),
        percentage: z
          .union([z.string(), z.number()])
          .optional()
          .describe('该项占比，如“58%”或 58；不确定时省略，不要编造'),
        color: z.string().optional().describe('仅在必须区分语义色时填写；通常省略，由主题着色')
      })
    )
    .optional()
    .describe('互斥分类及其数值，建议 2–6 项')
})

const statCardPropsSchema = z.object({
  title: z.string().describe('指标名称'),
  value: z.string().describe('当前值的展示文案'),
  description: z.string().optional().describe('底部说明。标题和趋势已经说清时省略'),
  icon: z
    .string()
    .optional()
    .describe('图标名称：dollar、users、creditCard、activity，或任意 Lucide 图标名'),
  iconPosition: z
    .enum(['left', 'right'])
    .optional()
    .describe('图标位置：left 与标题同一行，right 在右上角（默认）'),
  trend: z
    .enum(['up', 'down', 'neutral'])
    .optional()
    .describe('相对对比期的方向；没有可比基准时省略'),
  trendValue: z.string().optional().describe('变化幅度的展示文案，如“+12%”'),
  trendLabel: z.string().optional().describe('比较基准，如“较上期”'),
  previousValue: z.string().optional().describe('对比期的展示值'),
  previousLabel: z.string().optional().describe('对比期名称'),
  period: z.string().optional().describe('统计周期'),
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
    .describe('很短的单序列，只作当前值的走势上下文；需要读刻度或比较时改用折线或柱状图')
})

const breakdownCardPropsSchema = z.object({
  title: z.string().describe('卡片标题，说明被拆开的整体'),
  icon: z.string().optional().describe('标题前置图标名'),
  totalValue: z.string().optional().describe('合计的展示值'),
  totalLabel: z.string().optional().describe('合计的含义'),
  segments: z
    .array(
      z.object({
        label: z.string().describe('分段名称'),
        value: z.number().describe('分段数值，用于计算各段占合计的比例'),
        color: z.string().optional().describe('分段颜色；通常省略，由主题着色')
      })
    )
    .optional()
    .describe('可加总的分段，用于顶部比例条。分段很多或不可加总时不要传'),
  items: z
    .array(
      z.object({
        id: z.string().optional().describe('唯一标识'),
        label: z.string().describe('分项名称'),
        initial: z.string().optional().describe('缩写；缺省时取 label 首字母'),
        icon: z.string().optional().describe('前置图标名，优先级高于 initial'),
        avatar: z.string().optional().describe('头像图片地址'),
        value: z.union([z.string(), z.number()]).describe('分项数值或展示文案'),
        trend: z
          .enum(['up', 'down', 'neutral'])
          .optional()
          .describe('相对对比期的方向；没有可比基准时省略'),
        trendValue: z.string().optional().describe('变化幅度的展示文案'),
        secondaryValue: z.string().optional().describe('次要说明')
      })
    )
    .describe('分项明细，建议 3–8 项'),
  columns: z
    .object({
      channelLabel: z.string().optional().describe('第一列表头。默认“渠道”，请改成实际列名'),
      valueLabel: z.string().optional().describe('第二列表头。默认“数量”，请改成实际列名'),
      trendLabel: z.string().optional().describe('第三列表头。默认“合计”，请改成实际列名')
    })
    .optional()
    .describe('表头文案，按分项的实际含义填写')
})

const heatmapCardPropsSchema = z.object({
  title: z.string().describe('矩阵标题，说明行与列交叉后表示的强度'),
  icon: z.string().optional().describe('标题图标名'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('整体相对基准的方向；没有就省略'),
  trendValue: z.string().optional().describe('右上角变化文案；没有可比基准时省略'),
  xLabels: z.array(z.string()).describe('列标签，一个分类维，如时间桶或分组'),
  yLabels: z.array(z.string()).describe('行标签，另一个分类维'),
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
            title: z.string().optional().describe('悬浮提示第一行，通常是行的含义'),
            subtitle: z.string().optional().describe('悬浮提示第二行，通常是列的含义'),
            value: z.string().optional().describe('悬浮提示中的格值')
          })
          .optional()
          .describe('悬浮提示详情')
      })
    )
    .describe('矩阵单元格数据列表'),
  legend: z
    .array(
      z.object({
        label: z.string().describe('图例文案'),
        intensity: z.enum(['high', 'medium', 'low', 'none']).describe('对应强度等级')
      })
    )
    .optional()
    .describe('自定义热力图例，缺省为 高/中/低')
})

const sparklineCardPropsSchema = z.object({
  title: z.string().describe('指标名称'),
  value: z.string().describe('当前汇总值的展示文案'),
  period: z.string().optional().describe('统计周期'),
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
    .describe('短序列。点太多时迷你图不可读，改用折线或面积图'),
  type: z
    .enum(['bar', 'line'])
    .optional()
    .describe('微图类型：bar 迷你柱状图（默认），line 迷你折线图'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('变化趋势'),
  trendValue: z.string().optional().describe('趋势百分比，如“+12.4%”'),
  icon: z.string().optional().describe('右上角图标')
})

const dumbbellChartPropsSchema = z.object({
  title: z.string().describe('标题，说明同一批条目正在比较的两种状态'),
  subtitle: z.string().optional().describe('可选背景；没有就省略'),
  summaryLabel: z
    .string()
    .optional()
    .describe('右上角汇总名称。仅在传入 summaryValue 时出现；缺省为中位变化，请改成实际含义'),
  summaryValue: z.string().optional().describe('右上角汇总展示值；不需要汇总时省略'),
  beforeLabel: z
    .string()
    .optional()
    .describe('第一种状态的图例。缺省为之前，必须改成数据中的状态名'),
  afterLabel: z
    .string()
    .optional()
    .describe('第二种状态的图例。缺省为之后，必须改成数据中的状态名'),
  items: z
    .array(
      z.object({
        label: z.string().describe('条目名称'),
        before: z.number().describe('第一种状态的数值，必须与 after 同量纲'),
        after: z.number().describe('第二种状态的数值，必须与 before 同量纲'),
        unit: z.string().optional().describe('单项单位；与全局单位相同时省略'),
        displayValue: z.string().optional().describe('右侧对比文案；缺省时用前后数值')
      })
    )
    .describe('对比条目列表'),
  min: z.number().optional().describe('X 轴刻度起始值，默认 0'),
  max: z.number().optional().describe('X 轴刻度最大值，缺省自动计算'),
  unit: z.string().optional().describe('全局单位。缺省为毫秒，不是时长时必须传入'),
  ticks: z
    .array(z.number())
    .optional()
    .describe('自定义 X 轴刻度点列表，如 [0, 175, 350, 525, 700]'),
  footer: z.string().optional().describe('底部备注说明文案')
})

const activityCalendarPropsSchema = z.object({
  title: z.string().describe('日历标题，说明每日计数的含义'),
  subtitle: z.string().optional().describe('副标题，说明时间范围和计数口径'),
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
    .describe(
      '每日活动数据。必须传入真实 date、count 与 level；缺省或空数组时组件只显示空态，不会生成示例矩阵'
    ),
  footer: z.string().optional().describe('底部说明，如标注最暗活跃日或版本发布事件')
})

const waterfallChartPropsSchema = z.object({
  title: z.string().describe('标题，说明从起点到终点的差额由哪些增减项构成'),
  value: z.string().optional().describe('终点或当前合计的展示值'),
  trendValue: z.string().optional().describe('相对起点或对比期的变化文案'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('趋势方向'),
  baseline: z
    .number()
    .optional()
    .describe('坐标轴起始值。变化相对基数很小时可抬高起点，便于看见增减'),
  max: z.number().optional().describe('坐标轴上限最大值'),
  steps: z
    .array(
      z.object({
        label: z.string().describe('步骤名。起点、增减项和终点都要能单独读懂'),
        value: z.number().describe('增减项用带符号的变化量，合计项用绝对量'),
        formattedValue: z.string().optional().describe('该步的展示文案'),
        isTotal: z.boolean().optional().describe('是否为合计锚点（起点或终点），默认 false')
      })
    )
    .describe('瀑布变动步骤列表'),
  legend: z
    .object({
      totalLabel: z.string().optional().describe('合计项图例。缺省为合计，请改成实际含义'),
      gainLabel: z.string().optional().describe('正向增减图例。缺省为增加，请改成实际含义'),
      lossLabel: z.string().optional().describe('负向增减图例。缺省为减少，请改成实际含义')
    })
    .optional(),
  footer: z.string().optional().describe('底部备注说明文案')
})

const uptimeCardPropsSchema = z.object({
  title: z.string().describe('标题，说明这组对象的逐日离散状态'),
  subtitle: z.string().optional().describe('副标题，说明时间范围'),
  dateLabels: z
    .array(z.string())
    .optional()
    .describe('表头 30 天日期数字刻度列表，如 [“14”, “15”, ... “12”]'),
  services: z
    .array(
      z.object({
        service: z.string().describe('一行所代表的对象名称'),
        uptime: z.string().optional().describe('该行的汇总比率展示文案，如“99.98%”'),
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
      operationalLabel: z
        .string()
        .optional()
        .describe('正常状态图例。缺省为正常，请改成实际状态名'),
      degradedLabel: z.string().optional().describe('降级状态图例。缺省为降级，请改成实际状态名'),
      outageLabel: z.string().optional().describe('故障状态图例。缺省为故障，请改成实际状态名')
    })
    .optional(),
  footer: z.string().optional().describe('底部备注说明')
})

const ganttChartPropsSchema = z.object({
  title: z.string().optional().describe('标题，说明这组带起止的事项'),
  subtitle: z.string().optional().describe('副标题，说明时间范围或计划口径'),
  metrics: z
    .array(
      z.object({
        label: z.string().describe('汇总指标名称'),
        value: z.string().describe('汇总指标的展示文案'),
        progress: z.number().describe('进度百分比 (0-100)')
      })
    )
    .optional()
    .describe('顶部进度汇总。没有容量或完成度数据时省略'),
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
        title: z.string().describe('事项名称'),
        status: z
          .enum(['done', 'in_progress', 'todo'])
          .optional()
          .describe('状态：done(已完成中灰)、in_progress(进行中深黑)、todo(待办浅灰)'),
        statusLabel: z.string().optional().describe('状态展示文案，按事项的真实状态填写'),
        points: z
          .union([z.string(), z.number()])
          .optional()
          .describe('可选的工作量估计；没有就省略'),
        start: z.union([z.string(), z.number()]).describe('开始刻度，必须取自 dates'),
        end: z.union([z.string(), z.number()]).describe('结束刻度，必须取自 dates'),
        color: z.string().optional().describe('自定义排期条背景颜色')
      })
    )
    .describe('任务列表与排期起止'),
  footer: z.string().optional().describe('底部说明，例如条表示计划区间而不是已发生的工作量')
})

/**
 * 平台无关的 A2UI catalog 定义（Zod + description）。
 * Web 侧交给 `createCatalog`，Runtime 侧交给 `a2ui.schema`。
 */
export const zenA2uiCatalogDefinitions = {
  Row: {
    description:
      '横向弹性布局容器，适合并排 KPI（StatCard）。子项按自身容器宽度换行，放不下时自动堆叠。多图等高网格请优先用 Grid。',
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
      'CSS Grid 多列布局：同一行内子卡片默认等高。columns 是期望的最大列数，画布变窄时按网格自身宽度自动降列，不要按屏幕宽度少给列。多图仪表盘请优先用本组件。',
    props: z.object({
      children: z.array(z.string()).describe('子组件 ID 列表，按行优先顺序排布'),
      columns: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional()
        .describe('期望的最大列数，默认 2，取值 1–4。容器变窄时自动降列'),
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
      '单个当前值（自带卡片）。适合总览里少数几个核心数字，可附对比期、方向和很短的走势。不适合分类对比、构成占比，或需要坐标轴才能读懂的序列。直接挂在 Grid/Row/Column 下。',
    props: statCardPropsSchema
  },
  SparklineCard: {
    description:
      '紧凑的当前值加迷你走势（自带卡片）。适合一行并排多个短序列，看方向而不是读刻度。不适合多序列、长周期，或需要比较精确数值；那些改用折线、柱状或表格。直接挂在 Grid/Row/Column 下。',
    props: sparklineCardPropsSchema
  },
  BreakdownCard: {
    description:
      '一个合计拆成少量分项（自带卡片）。比例条表示可加总的份额，明细列出每项数值和可选涨跌。适合大约 3–8 个互斥分项。不适合不可加总的指标、分项很多，或沿时间变化的序列。直接挂在 Grid/Row/Column 下。',
    props: breakdownCardPropsSchema
  },
  HeatmapCard: {
    description:
      '二维强度矩阵（自带卡片）。适合行、列都是分类、交叉格表示强弱的数据，用来看冷热区域而不是精确比较相邻格。不适合只有一个分类维、需要精确读数，或任一侧类别过多。必须有 cells。直接挂在 Grid/Row/Column 下。',
    props: heatmapCardPropsSchema
  },
  DumbbellChart: {
    description:
      '成对数值对比（自带卡片）。同一批条目各有两个同量纲数值，看每条的方向和幅度。不适合两种以上状态、量纲不同，或时间上有很多个点。图例缺省为之前/之后，单位缺省为毫秒，与数据不符时必须传入 beforeLabel、afterLabel 和 unit。直接挂在 Grid/Row/Column 下。',
    props: dumbbellChartPropsSchema
  },
  ActivityCalendar: {
    description:
      '按日密度日历（自带卡片）。适合连续数周到数月、每天一个计数，看忙闲和空档。不适合非按日数据、只有汇总没有每日计数，或要判断斜率的趋势（改折线或面积）。必须传入真实 date，空数组只显示空态。直接挂在 Grid/Row/Column 下。',
    props: activityCalendarPropsSchema
  },
  WaterfallChart: {
    description:
      '差额分解（自带卡片）。适合从一个起点经过若干可正可负的增减项，解释如何到达终点；合计步用 isTotal。不适合互不相关的分类对比、时间走势、占比，或各步加总后对不上终点。没有 steps 不要用。直接挂在 Grid/Row/Column 下。',
    props: waterfallChartPropsSchema
  },
  UptimeCard: {
    description:
      '多对象的逐日离散状态网格（自带卡片）。每行约 30 个三态：正常、降级、故障，用来看哪一天、哪个对象异常。不适合连续数值、没有逐日状态，或只有一个汇总比率（改 GaugeChart）。直接挂在 Grid/Row/Column 下。',
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
      '单系列面积图（自带卡片）。适合有序轴上的一个连续量，用面积强调体量起伏。不适合无序分类比较、多个系列，或只有两三个点；点少时改 StatCard 或柱状图，要看斜率时改折线。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  BarChart: {
    description:
      '单系列垂直柱（自带卡片）。适合少量、标签较短的离散分类比大小。不适合标签很长（改 HorizontalBarChart）、有序趋势（改折线或面积）、部分占整体（改饼图、环形或堆叠），或两个量纲（改 ComposedChart）。分类一多，横轴标签会挤在一起。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  HorizontalBarChart: {
    description:
      '横向条形（自带卡片）。适合排名和标签较长的分类比较，条尾可直接标出数值。不适合时间序列、占比构成，或类别少且标签很短的对比（那种用垂直柱更紧凑）。类别很多时只保留需要比较的前若干项。直接挂在 Grid/Row/Column 下。',
    props: horizontalBarChartPropsSchema
  },
  GroupedBarChart: {
    description:
      '分组柱（自带卡片）。适合同一分类下 2–4 个同量纲系列的并列比较。不适合系列更多（柱会挤住）、量纲不同（改 ComposedChart），或只关心加总后的内部构成（改 StackedBarChart）。直接挂在 Grid/Row/Column 下。',
    props: multiSeriesChartPropsSchema
  },
  StackedBarChart: {
    description:
      '堆叠柱（自带卡片），可纵向或横向。适合每个分类的总量，以及该总量由哪些同单位部分相加而成。不适合各部分要精确互比（堆叠后基线不同，改分组柱）、部分不能相加，或分类和系列都很多。直接挂在 Grid/Row/Column 下。',
    props: stackedBarChartPropsSchema
  },
  LineChart: {
    description:
      '单系列折线（自带卡片）。适合有序轴上的变化、拐点和斜率。不适合无序分类比大小（改柱状）、占比，或只有两三个点。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  MultiLineChart: {
    description:
      '多折线（自带卡片）。适合 2–5 条同量纲系列在同一有序轴上比较走势。不适合量纲不同（范围差大会把小系列压扁，改 ComposedChart）、系列过多互相缠绕，或无序分类。直接挂在 Grid/Row/Column 下。',
    props: multiLineChartPropsSchema
  },
  StackedAreaChart: {
    description:
      '堆叠面积（自带卡片）。适合同单位、可相加的多个系列沿有序轴累积，同时看总量走势和构成变化。不适合不可加总、含负数、要精确比较各系列绝对值，或系列过多。直接挂在 Grid/Row/Column 下。',
    props: stackedAreaChartPropsSchema
  },
  ComposedChart: {
    description:
      '柱与折线复合（自带卡片）。适合同一分类轴上两个量纲不同的指标：柱表示绝对量，折线表示比率或速率，默认分左右轴。不适合两个指标同量纲（改分组柱或多折线）、超过两个系列，或两条序列对不齐到同一 label。直接挂在 Grid/Row/Column 下。',
    props: composedChartPropsSchema
  },
  PieChart: {
    description:
      '单环占比图（自带卡片，带图例，没有中心合计和明细表）。适合 2–5 个互斥且加总为整体的分类，用来看谁占大头。不适合类别多、各项接近、需要读出具体数值、时间趋势，或各项不能加总。要中心合计和逐项数值时改 DonutChart；要精确比较时改条形或表格。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  DonutChart: {
    description:
      '环形图加分类明细（自带卡片）。适合少量互斥分类占同一整体，并要在中心展示合计、在一侧列出各项数值和占比。不适合类别很多、时间序列、非互斥或不可加总的指标。只需要看份额形状时用 PieChart。必须传 title 和 centerLabel，缺省分别为「分类占比」和「合计」。直接挂在 Grid/Row/Column 下。',
    props: donutChartPropsSchema
  },
  RadarChart: {
    description:
      '雷达图（自带卡片）。适合 4–8 个同一量表的维度，看轮廓强弱而不是精确读数。不适合维度过少或过多、量纲不一致、有序时间，或某一维远大于其余维（图形会被拉变形）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  RadialChart: {
    description:
      '径向条（自带卡片）。分类名不画在图上，只出现在悬浮提示里，弧长也不如直柱好比较。只适合分类很少、标签不重要的相对大小。需要读出分类名、精确比较、时间趋势或占比时，改用柱状、横向条形、饼图或环形图。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  GaugeChart: {
    description:
      '半圆仪表（自带卡片）。适合一个数值在明确上下限之间的位置，如比率、完成度或使用率。不适合多个分类对比、没有上下限的绝对量、时间趋势或分布。一个仪表只表达一个当前值。直接挂在 Grid/Row/Column 下。',
    props: gaugeChartPropsSchema
  },
  FunnelChart: {
    description:
      '阶段漏斗（自带卡片）。适合有严格先后顺序、后一阶段是前一阶段子集、数值整体递减的过程，并看相邻转化。不适合各阶段互不包含、数值不递减、无序占比或时间趋势。阶段宜为 3–6 个，必须按流程顺序，禁止按大小重排。直接挂在 Grid/Row/Column 下。',
    props: funnelChartPropsSchema
  },
  GanttChart: {
    description:
      '带起止的排期（自带卡片）。适合看事项的并行、重叠，以及相对今天的位置。不适合没有起止的列表、纯数值对比或分布。start/end 必须对应 dates 里的标签；没有真实起止不要用。直接挂在 Grid/Row/Column 下。',
    props: ganttChartPropsSchema
  },
  ScatterChart: {
    description:
      '散点图（自带卡片）。适合同一批对象上的两个连续变量，看关系、离群和大致分群。不适合分类比大小、只有一个变量，或点很多还要读出每个名称（标签会叠）。直接挂在 Grid/Row/Column 下。',
    props: scatterChartPropsSchema
  },
  DataTable: {
    description:
      '明细表。适合需要精确读数、多列、排序或状态标签的记录。不适合只看趋势、占比或排名形状，那些用对应的图。',
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
  Tooltip: {
    description:
      '悬浮提示。可见内容过长或需要补充口径时使用：悬停或聚焦展示 content。text 为单行可见文案，超出容器宽度自动截断；也可以用 child 包裹另一个组件。不要用它替代图表数据点自带的悬浮层。',
    props: z.object({
      content: z.string().describe('悬浮或聚焦时展示的完整说明'),
      text: z.string().optional().describe('触发器上的可见文案；过长时按容器宽度单行截断'),
      child: z.string().optional().describe('触发器子组件 ID。与 text 同时存在时优先使用 child'),
      side: z
        .enum(['top', 'right', 'bottom', 'left'])
        .optional()
        .describe('提示出现在触发器的哪一侧，默认 top')
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

自定义组件列表（选型看数据形态，不看行业；各组件描述里的「适合 / 不适合」优先于任何举例）：
- 布局与容器：Row、Column、Grid、DashboardCard、ScrollArea、Tabs、Tooltip
- 单个值与结构化卡片：
  * StatCard：一个当前值，可带对比期和很短走势。不适合分类对比或构成
  * SparklineCard：一行并排多个短序列的当前值，看方向不读刻度
  * BreakdownCard：一个合计拆成大约 3–8 个可加总分项
  * HeatmapCard：两个分类维交叉后的强度。必须有 cells
  * DumbbellChart：同一批条目的两个同量纲数值。缺省图例之前/之后、单位毫秒，不符时必须改
  * ActivityCalendar：按日的一个计数。必须有真实 date；要看斜率改折线
  * WaterfallChart：起点经带符号增减项到达终点。没有 steps 不要用
  * UptimeCard：多个对象 × 约 30 个离散状态（正常/降级/故障）。连续数值不要用
  * GanttChart：带起止的事项。没有起止不要用
  * Metric、Progress、Item、ItemGroup、UserCard、RoleCard、PostCard、OrganizationCard
- 列表与表格：DataTable（精确明细）、Timeline、Avatar、Badge、Icon
- 统计图（均自带单层卡片）：
  * 离散分类、标签短、一类一个数：BarChart。标签长或要排名：HorizontalBarChart
  * 同一分类 2–4 个同量纲系列：GroupedBarChart。同单位且要看总量里的部分：StackedBarChart
  * 有序轴上的单系列：看体量用 AreaChart，看斜率用 LineChart。2–5 条同量纲走势：MultiLineChart。可加总构成沿有序轴变化：StackedAreaChart
  * 同一轴上两个不同量纲：ComposedChart（柱为绝对量，折线为比率或速率）
  * 2–5 个互斥分类占同一整体：只看份额用 PieChart；还要中心合计和明细用 DonutChart（必须传 title、centerLabel）
  * 4–8 个同一量表的维度轮廓：RadarChart。RadialChart 的分类名不在图上，只在分类很少且不需要读名时用
  * 一个有上下限的比率：GaugeChart。有序递减且后阶段是前阶段子集：FunnelChart。两个连续变量的关系：ScatterChart
基础组件（basic catalog）：Text、Button、Card、List、Image、TextField 等

组装与图表选型规则：
1. 必须有 id="root" 的根节点，优先用 Column / Row / Grid 做布局
2. 用 children / child 引用其它组件 id；id 在同一 surface 内唯一，禁止自引用
3. StatCard / SparklineCard / BreakdownCard / HeatmapCard / DumbbellChart / ActivityCalendar / WaterfallChart / UptimeCard / GanttChart / 各类 Chart 组件已自带单层卡片：直接挂到 Grid/Row/Column，禁止再包 DashboardCard 或 basic Card（否则双层嵌套）
4. 多图并排或 2×2 仪表盘：用 Grid（columns 为期望的最大列数，如 2 或 4）。列数按画布容器宽度自动下降，不要按屏幕宽度少给列，也不要用多层 Row 拼网格；同一行卡片会自动等高
5. 顶栏和结构化卡片按数据形态放：
   - 少数当前值用 StatCard；多个短序列并排用 Grid(columns=4) 包 SparklineCard
   - 合计拆分用 BreakdownCard；二维强度用 HeatmapCard；成对数值用 DumbbellChart
   - 按日密度用 ActivityCalendar；增减解释差额用 WaterfallChart；逐日离散状态用 UptimeCard；带起止的事项用 GanttChart
6. 统计图按形态选，避免整页只有一种柱，也不要为了看起来丰富而套不匹配的图：
   - 离散分类比大小、标签短：BarChart；标签长或要排名：HorizontalBarChart
   - 同一分类上 2–4 个同量纲系列：GroupedBarChart；同单位且要看加总构成：StackedBarChart 或 StackedAreaChart
   - 有序轴上的单系列变化：看体量用 AreaChart，看斜率用 LineChart；2–5 条同量纲走势：MultiLineChart
   - 同一轴上的绝对量加另一量纲的比率：ComposedChart
   - 2–5 个互斥分类占整体：只看份额用 PieChart；还要合计和明细用 DonutChart
   - 4–8 个同量表维度的轮廓：RadarChart
   - 一个有上下限的比率：GaugeChart
   - 有序且递减、后阶段是前阶段子集：FunnelChart，禁止按大小重排
   - 两个连续变量：ScatterChart
   - 现有统计接口已经按上述形态给出序列时，按下面原样绑定。这是字段对应关系，不表示组件只服务该业务：
   - 图表序列优先使用各统计接口的 series，以及审计接口的 sparklines、heatmap、calendar、quotas、trend。原始计数字段仍可用于核对，不要另算一套不一致的百分比。
   - 用户看板：series.rates 的 0-1 比率给 GaugeChart（value=比率×100，max=100）；series.funnel 原序给 FunnelChart；series.health 给 RadarChart（value 已是 0-100）；series.statusDistribution / genderDistribution 给 DonutChart；series.weeklyNewUsers 给 GroupedBarChart（key 为 previous、current）；series.creationCalendar 原样作为 ActivityCalendar.days；trend 给 LineChart/AreaChart；topOrganizations 给 HorizontalBarChart；recentTrends.growthRate 给 StatCard。
   - 岗位与组织看板：overallFillRate、leaderCoverageRate 给 GaugeChart；series.fillMix、series.familyDistribution、series.typeDistribution、series.leaderDistribution 给 DonutChart；series.staffingComparison 给 GroupedBarChart（key 为 plan、actual）或 DumbbellChart（before=plan，after=actual，unit 为「人」）；series.staffingScatter 给 ScatterChart（x=编制，y=在岗）；series.memberSizeBuckets 与 structure.byLevel 给 BarChart；topUnderstaffedPositions 给 HorizontalBarChart。
   - 角色看板：series.roleComparison 给 GroupedBarChart（key 为 userCount、permissionCount）；series.kindDistribution、statusDistribution、dataScopeDistribution 给 DonutChart；series.rates 给 GaugeChart；topRoles / topRolesByPermissions 给 HorizontalBarChart。
   - 登录统计：绘制活动日历或热力时把 days 设为 84。heatmap 的 xLabels、yLabels、cells 原样给 HeatmapCard；calendar 原样给 ActivityCalendar.days；trend 的 successCount/failureCount 给 StackedBarChart 或 MultiLineChart；successRate 给 GaugeChart；series.outcomeDistribution / eventDistribution 给 DonutChart。
   - Agent 用量：trend 的 totalTokens 与 costMicros 给 ComposedChart，inputTokens 与 outputTokens 给 StackedAreaChart；series.purposeDistribution / statusDistribution 与 byModel 给 DonutChart；successRate 给 GaugeChart。只有 quotas 非空时才画配额仪表，value 用 usageRate×100；usageRate 大于 1 时 status=destructive。quotas 为空禁止编造配额。
   - 审计概览 sparklines.dates 与 operations、logins、requests、agentRuns 等长，给 SparklineCard，禁止截断或补数。
   - API 访问：errorRate 给 GaugeChart；trend 的 requestCount 与 errorRate×100 给 ComposedChart；series.callerDistribution / outcomeDistribution 给 DonutChart；series.latencyDistribution 给 BarChart；topRoutes 给 HorizontalBarChart。
   - 操作审计：trend 的 successCount、failureCount、deniedCount 给 StackedBarChart；series.actionRanking / resourceRanking 给 HorizontalBarChart；series.resultDistribution / actorDistribution 给 DonutChart。安全统计 trend 的 denied、failed、failedLogins 给 MultiLineChart。
   - 字典看板使用 query_dictionary_workspaces 的 stats：kindDistribution、itemStatusDistribution 给 DonutChart，workspaceRanking 给 HorizontalBarChart，allCount、itemCount、starredCount 给 StatCard。
   - 系统统计没有服务可用率、项目排期或财务流水快照。禁止用 UptimeCard、GanttChart、WaterfallChart 展示这些统计。接口没有返回 days、cells 或 steps 时，也不要使用 ActivityCalendar、HeatmapCard、WaterfallChart。
   - 趋势规则：只有接口明确返回按时间分桶的数据时才使用折线、面积、热力或活动日历；只有同一分类含多个可比数值系列时才使用分组/堆叠图。缺少支撑维度时选用排行、构成、KPI 与表格，不生成示例或估算数据。
7. 图表组件自身的 title 尽量填写；DonutChart 的 title 和 centerLabel 必填。description 仅在需要补充口径时填写，标题已足够则省略。不要传 color，配色由主题 token 决定。DumbbellChart 在单位不是时长时必须传 unit，并传入两种状态的图例名
8. 分类轴标签、GaugeChart.subtext、卡片标题写完整原文。界面会按所在卡片宽度截断，悬停显示全文，不要自行截成看不懂的缩写。需要给任意文字补说明时用 Tooltip（content 为悬浮全文，text 为可见文案，或用 child 包裹子组件）
9. Timeline 时间线支持丰富模式（请避免千篇一律只用同一种带圆圈图标的风格）：
   - 跨多天/多阶段活动记录优先使用 groups 分组模式（按日期「2026年X月X日」断开连线，组头连组内）
   - 用户操作/团队动态优先用 variant="avatar" 人员头像节点模式
   - 状态追踪/审批进度优先用 variant="solid-dot" 实心彩色点或 variant="dot" 极简空心点
   - 多类型业务动作流可用 variant="icon" 配合 side 分类列（如「岗位」「成员」「组织」）
`.trim()
