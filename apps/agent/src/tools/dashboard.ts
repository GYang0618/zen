import { tool } from 'langchain'
import { z } from 'zod'

import { buildDynamicDashboardSurface } from '../a2ui'
import { executeApiCall, resolveToolCallIdentity, userControllerFindAll } from '../api'

import type { User } from '@zen/shared'

const generateDashboardSchema = z.object({
  title: z.string().describe('看板主标题，例如“系统运营与数据概览”或“用户活跃监控看板”'),
  summary: z.string().optional().describe('看板副标题或概括性说明文字'),
  metrics: z
    .array(
      z.object({
        label: z.string().describe('指标名称，如“总用户数”、“正常用户”、“活跃度”'),
        value: z.string().describe('指标当前数值，如“1,280”、“98.5%”'),
        trend: z.enum(['up', 'down', 'neutral']).optional().describe('指标变化趋势'),
        trendValue: z.string().optional().describe('趋势变化百分比或差值，如“+14.2%”')
      })
    )
    .optional()
    .describe('顶栏 KPI 指标卡片列表，自动通过横向 Row 排布'),
  chart: z
    .object({
      title: z.string().describe('图表标题，例如“近 7 天活跃趋势”'),
      data: z
        .array(
          z.object({
            label: z.string().describe('X 轴分类或日期，如“09-05”或“周一”'),
            value: z.number().describe('统计数值')
          })
        )
        .describe('图表数据项列表'),
      color: z.string().optional().describe('柱状图主题色 HEX，默认使用主题色')
    })
    .optional()
    .describe('动态柱状趋势分析图表'),
  includeUserTable: z
    .boolean()
    .optional()
    .default(false)
    .describe('是否在看板下方联动嵌入用户数据表格，用于呈现真实业务数据联动'),
  userTableTitle: z.string().optional().describe('嵌入用户数据表格的自定义标题')
})

export const generateDashboardTool = tool(
  async (input, config) => {
    let users: User[] = []

    if (input.includeUserTable) {
      try {
        const rawUsers = await executeApiCall(config, async () =>
          userControllerFindAll({
            query: { pageSize: 5 }
          })
        )
        const parsed = JSON.parse(rawUsers)
        if (parsed?.data?.items && Array.isArray(parsed.data.items)) {
          users = parsed.data.items as User[]
        }
      } catch {
        // 容错处理
      }
    }

    const { toolCallId: resolvedToolCallId } = resolveToolCallIdentity(config as never)
    const toolCallId = resolvedToolCallId || String(Date.now())
    const surfaceId = `a2ui-${toolCallId}`

    const a2ui_operations = buildDynamicDashboardSurface({
      surfaceId,
      title: input.title,
      summary: input.summary,
      metrics: input.metrics,
      chart: input.chart,
      userTable: input.includeUserTable ? { title: input.userTableTitle, users } : undefined
    })

    return JSON.stringify({
      code: 200,
      message: '动态仪表盘已成功生成并挂载至生成式工作区',
      data: {
        title: input.title,
        metricsCount: input.metrics?.length ?? 0,
        hasChart: Boolean(input.chart),
        hasUserTable: input.includeUserTable
      },
      a2ui_operations
    })
  },
  {
    name: 'generate_dynamic_dashboard',
    description:
      '生成动态 A2UI 数据看板/运营仪表盘。支持自由灵活组合顶栏指标卡 (Metric)、柱状趋势图 (BarChart)、分栏布局 (Row/Column) 与数据表格 (UserTable)。' +
      '当用户要求查看/生成系统概览、运营总览、数据监控、KPI 看板或要求通过图表与指标动态展示业务情况时，必须调用此工具。',
    schema: generateDashboardSchema
  }
)

export const dashboardTools = [generateDashboardTool] as const
