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

const statCardPropsSchema = z.object({
  title: z.string().describe('指标标题，如“总营收”'),
  value: z.string().describe('当前指标数值，如“$45,231.89”'),
  description: z.string().optional().describe('底部说明，如“较上月增长 20.1%”'),
  icon: z
    .enum(['dollar', 'users', 'creditCard', 'activity'])
    .optional()
    .describe('右上角图标：dollar / users / creditCard / activity'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('指标变化趋势，影响说明文字颜色'),
  trendValue: z
    .string()
    .optional()
    .describe('当未提供 description 时，可作为底部说明展示，如“+20.1%”')
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
      '运营统计卡片：标题 + 可选图标 + 大号数值 + 底部说明，适合顶栏 KPI（如总营收、订阅用户）。',
    props: statCardPropsSchema
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
      '面积图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  BarChart: {
    description:
      '柱状图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  LineChart: {
    description:
      '折线图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
  },
  PieChart: {
    description:
      '饼图/环形图（自带单层卡片：标题 + 可选描述 + 图表）。直接放在 Grid/Row/Column 下，勿再套 DashboardCard / Card。',
    props: chartPropsSchema
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
  DataTable: {
    description: '通用数据表格组件，支持多列定义、数据行展示及表头交互排序。',
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
              .enum(['text', 'badge', 'avatar', 'progress', 'tag', 'date', 'icon'])
              .optional()
              .describe('单元格特殊渲染类型')
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
    description: '时间线展示组件，适用于活动动态、操作记录、审批流程等顺序列表。',
    props: z.object({
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
            icon: z.string().optional().describe('节点图标名'),
            side: z.string().optional().describe('左侧辅助说明')
          })
        )
        .describe('时间线节点列表'),
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

自定义组件：Row、Column、Grid、DashboardCard、StatCard、Metric、Area/Bar/Line/Pie/Radar/RadialChart、DataTable、Icon、Timeline、Avatar、Badge、ScrollArea、Tabs、Progress、Item、ItemGroup、UserCard、RoleCard、PostCard、OrganizationCard
基础组件（basic catalog）：Text、Button、Card、List、Image、TextField 等

组装规则：
1. 必须有 id="root" 的根节点，优先用 Column / Row / Grid 做布局
2. 用 children / child 引用其它组件 id；id 在同一 surface 内唯一，禁止自引用
3. StatCard / Metric / *Chart 已是单层卡片：直接挂到 Grid/Row/Column，禁止再包 DashboardCard 或 basic Card（否则双层嵌套）
4. 多图并排或 2×2 仪表盘：用 Grid（columns=2），不要用多层 Row 拼网格；同一行卡片会自动等高
5. 顶栏 KPI 仍可用 Row 并排 StatCard
6. 图表组件自身的 title 尽量填写；description 仅在需要补充上下文时填写，标题已足够则省略；不要传 color，配色由主题 token 自动决定
7. 按场景自由组合，不要套固定「指标行 + 单图」模板
`.trim()
