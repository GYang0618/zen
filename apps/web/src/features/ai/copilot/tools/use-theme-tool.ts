import { useAgentContext, useFrontendTool } from '@copilotkit/react-core/v2'
import {
  ACCENT_THEME_IDS,
  BASE_THEME_IDS,
  FONT_THEME_IDS,
  STYLE_THEME_IDS,
  useSidebar
} from '@zen/ui'
import { z } from 'zod'

import { useBaseColor } from '@/context/base-color-provider'
import { useBrandColor } from '@/context/brand-color-provider'
import { useFont } from '@/context/font-provider'
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'
import { useUiStyle } from '@/context/ui-style-provider'

import type { BaseColor } from '@/context/base-color-provider'
import type { BrandColor } from '@/context/brand-color-provider'
import type { Font } from '@/context/font-provider'
import type { Collapsible } from '@/context/layout-provider'
import type { UiStyle } from '@/context/ui-style-provider'

const themeModeValues = ['light', 'dark', 'system'] as const
const sidebarValues = ['inset', 'floating', 'sidebar'] as const
const layoutValues = ['default', 'icon', 'offcanvas'] as const

type ThemeMode = (typeof themeModeValues)[number]
type SidebarVariant = (typeof sidebarValues)[number]
type LayoutPreset = (typeof layoutValues)[number]

const appearanceSchema = z.object({
  themeMode: z
    .enum(themeModeValues)
    .optional()
    .describe('主题模式：light=亮色，dark=暗色，system=跟随系统'),
  baseColor: z
    .enum(BASE_THEME_IDS)
    .optional()
    .describe(
      `基础色（背景/文字/边框底色）。可选：${BASE_THEME_IDS.join('、')}。slate 为系统默认蓝灰`
    ),
  brandColor: z
    .enum(ACCENT_THEME_IDS)
    .optional()
    .describe(
      `品牌主题色（主按钮/强调色）。可选：${ACCENT_THEME_IDS.join('、')}。neutral 表示沿用当前基础色的 primary，不另设强调色`
    ),
  font: z
    .enum(FONT_THEME_IDS)
    .optional()
    .describe(`正文字体。可选：${FONT_THEME_IDS.join('、')}。geist 为系统默认`),
  style: z
    .enum(STYLE_THEME_IDS)
    .optional()
    .describe(
      `界面样式（圆角与造型密度）。可选：${STYLE_THEME_IDS.join('、')}。nova=默认紧凑，vega=经典，maia=柔和大圆角，lyra/sera=零圆角硬朗，mira=高密度，luma=流体大圆角，rhea=紧凑胶囊`
    ),
  sidebar: z
    .enum(sidebarValues)
    .optional()
    .describe('侧边栏形态：inset=内嵌，floating=悬浮，sidebar=经典贴边'),
  layout: z
    .enum(layoutValues)
    .optional()
    .describe('布局：default=侧边栏展开默认，icon=折叠为图标紧凑，offcanvas=完整收起（离画布）'),
  rationale: z
    .string()
    .optional()
    .describe('向用户说明本次选择/推荐理由（尤其在用户要求「推荐」时必填）')
})

type AppearanceParams = z.infer<typeof appearanceSchema>

const RECOMMENDATION_HINTS = {
  dark: {
    preferredBaseColors: ['zinc', 'slate', 'neutral', 'mist'],
    preferredBrandColors: ['sky', 'cyan', 'violet', 'indigo', 'blue', 'emerald', 'teal', 'slate'],
    avoidBrandColors: ['yellow', 'lime'],
    note: '暗色下优先冷调基础色 + 中高对比强调色；yellow/lime 作主色易刺眼'
  },
  light: {
    preferredBaseColors: ['slate', 'stone', 'taupe', 'neutral', 'olive'],
    preferredBrandColors: ['blue', 'indigo', 'rose', 'emerald', 'orange', 'violet', 'slate'],
    avoidBrandColors: [] as string[],
    note: '亮色下可选暖调基础色（stone/taupe）或中性 slate；强调色避免过浅'
  },
  pairingNotes: [
    '用户只要「推荐主题色」时：同时给出 baseColor + brandColor 搭配，不要只改一项',
    '暗色模式推荐示例：base=zinc + brand=sky / violet / emerald',
    '亮色模式推荐示例：base=stone + brand=orange；或 base=slate + brand=indigo',
    '专业克制：base=slate + brand=slate 或 neutral',
    '科技感：style=mira/lyra + font=jetbrains-mono + brand=cyan/sky',
    '柔和亲和：style=maia/luma + font=figtree/nunito-sans + brand=rose/pink'
  ]
} as const

function resolveLayoutPreset(open: boolean, collapsible: Collapsible): LayoutPreset {
  if (open) return 'default'
  if (collapsible === 'icon' || collapsible === 'offcanvas') return collapsible
  return 'default'
}

function buildChangeSummary(applied: Partial<Record<keyof AppearanceParams, string>>) {
  const labels: Record<string, string> = {
    themeMode: '主题模式',
    baseColor: '基础色',
    brandColor: '品牌主题色',
    font: '字体',
    style: '样式',
    sidebar: '侧边栏',
    layout: '布局'
  }

  const parts = Object.entries(applied)
    .filter(([key]) => key !== 'rationale')
    .map(([key, value]) => `${labels[key] ?? key}=${value}`)

  return parts.length > 0 ? `已更新：${parts.join('，')}` : '未检测到可应用的外观字段'
}

/**
 * 外观主题工具：支持一次切换主题模式 / 基础色 / 品牌色 / 字体 / 样式 / 侧边栏 / 布局中的一项或多项。
 */
export function useThemeTool() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { baseColor, setBaseColor } = useBaseColor()
  const { brandColor, setBrandColor } = useBrandColor()
  const { font, setFont } = useFont()
  const { style, setStyle } = useUiStyle()
  const { variant, setVariant, collapsible, setCollapsible } = useLayout()
  const { open, setOpen } = useSidebar()

  const layout = resolveLayoutPreset(open, collapsible)

  useAgentContext({
    description:
      '当前界面外观设置、可选预设与推荐指引。用户要求改主题/配色/字体/样式/侧边栏/布局时，必须调用 change_appearance；可一次传入多项。',
    value: {
      current: {
        themeMode: theme,
        resolvedTheme,
        baseColor,
        brandColor,
        font,
        style,
        sidebar: variant,
        layout
      },
      availableOptions: {
        themeMode: [...themeModeValues],
        baseColor: [...BASE_THEME_IDS],
        brandColor: [...ACCENT_THEME_IDS],
        font: [...FONT_THEME_IDS],
        style: [...STYLE_THEME_IDS],
        sidebar: [...sidebarValues],
        layout: [...layoutValues]
      },
      recommendationHints: {
        dark: {
          preferredBaseColors: [...RECOMMENDATION_HINTS.dark.preferredBaseColors],
          preferredBrandColors: [...RECOMMENDATION_HINTS.dark.preferredBrandColors],
          avoidBrandColors: [...RECOMMENDATION_HINTS.dark.avoidBrandColors],
          note: RECOMMENDATION_HINTS.dark.note
        },
        light: {
          preferredBaseColors: [...RECOMMENDATION_HINTS.light.preferredBaseColors],
          preferredBrandColors: [...RECOMMENDATION_HINTS.light.preferredBrandColors],
          avoidBrandColors: [...RECOMMENDATION_HINTS.light.avoidBrandColors],
          note: RECOMMENDATION_HINTS.light.note
        },
        pairingNotes: [...RECOMMENDATION_HINTS.pairingNotes]
      }
    }
  })

  useFrontendTool({
    name: 'change_appearance',
    description: [
      '切换系统外观主题。支持一次修改一项或多项：',
      'themeMode（亮/暗/跟随系统）、baseColor（基础色）、brandColor（品牌主题色）、',
      'font（字体）、style（样式）、sidebar（侧边栏）、layout（布局）。',
      '仅传入需要变更的字段；未传字段保持不变。',
      '当用户要求「推荐」配色/风格时：根据当前或目标 themeMode，从 availableOptions 中挑选合适搭配，',
      '写入对应字段，并在 rationale 说明理由。',
      '示例：暗色 + 推荐主题色 → themeMode=dark，并推荐 baseColor+brandColor（如 zinc+sky）。'
    ].join(''),
    parameters: appearanceSchema,
    handler: async (params) => {
      const previous = {
        themeMode: theme,
        baseColor,
        brandColor,
        font,
        style,
        sidebar: variant,
        layout
      }

      const applied: Partial<Record<keyof AppearanceParams, string>> = {}

      if (params.themeMode) {
        setTheme(params.themeMode as ThemeMode)
        applied.themeMode = params.themeMode
      }
      if (params.baseColor) {
        setBaseColor(params.baseColor as BaseColor)
        applied.baseColor = params.baseColor
      }
      if (params.brandColor) {
        setBrandColor(params.brandColor as BrandColor)
        applied.brandColor = params.brandColor
      }
      if (params.font) {
        setFont(params.font as Font)
        applied.font = params.font
      }
      if (params.style) {
        setStyle(params.style as UiStyle)
        applied.style = params.style
      }
      if (params.sidebar) {
        setVariant(params.sidebar as SidebarVariant)
        applied.sidebar = params.sidebar
      }
      if (params.layout) {
        if (params.layout === 'default') {
          setOpen(true)
        } else {
          setOpen(false)
          setCollapsible(params.layout as Collapsible)
        }
        applied.layout = params.layout
      }

      if (Object.keys(applied).length === 0) {
        return {
          status: 'noop',
          message: '未提供任何外观字段，外观保持不变',
          previous,
          current: previous,
          hint: '请至少传入 themeMode / baseColor / brandColor / font / style / sidebar / layout 之一'
        }
      }

      const current = {
        themeMode: applied.themeMode ?? previous.themeMode,
        baseColor: applied.baseColor ?? previous.baseColor,
        brandColor: applied.brandColor ?? previous.brandColor,
        font: applied.font ?? previous.font,
        style: applied.style ?? previous.style,
        sidebar: applied.sidebar ?? previous.sidebar,
        layout: applied.layout ?? previous.layout
      }

      return {
        status: 'success',
        message: buildChangeSummary(applied),
        applied,
        previous,
        current,
        rationale: params.rationale
      }
    }
  })
}
