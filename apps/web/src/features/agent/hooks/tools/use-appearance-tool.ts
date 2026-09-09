import { useAgentContext, useFrontendTool } from '@copilotkit/react-core/v2'
import {
  ACCENT_THEME_IDS,
  BASE_THEME_IDS,
  FONT_THEME_IDS,
  STYLE_THEME_IDS,
  useSidebar
} from '@zen/ui'
import z from 'zod'

import { useBaseColor } from '@/context/base-color-provider'
import { useBrandColor } from '@/context/brand-color-provider'
import { useFont } from '@/context/font-provider'
import { LAYOUT_VARIANT_IDS, useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'
import { useUiStyle } from '@/context/ui-style-provider'

import type { Collapsible } from '@/context/layout-provider'

const THEME_MODE_IDS = ['light', 'dark', 'system'] as const
const LAYOUT_PRESET_IDS = ['default', 'icon', 'offcanvas'] as const

type LayoutPreset = (typeof LAYOUT_PRESET_IDS)[number]

const appearanceDescription = `设置系统外观：
  - 可一次修改一项或多项：themeMode、baseColor、brandColor、font、style、sidebar、layout。
  - 只传入需要变更的字段，未传字段保持不变。
  - 用户要求推荐时，根据各选项的特点与推荐场景自行判断并组合，不要套用固定搭配。
  - 用户要求恢复默认、重置主题或一键还原时，从上下文 defaults 读取对应值并作为参数传入：全部还原则传入全部 defaults 字段，单项还原只传入该项。
`

const appearanceSchema = z.object({
  themeMode: z
    .enum(THEME_MODE_IDS)
    .optional()
    .describe(`主题模式（界面明暗）：
      - light（亮色）把界面铺成浅底深字，纸面感强、对比清晰，整体更开放明亮
      - dark（暗色）反过来用深底浅字，层次更沉、更内收，常用来压低视觉噪音或做出夜色、影院、极客一类气质；白天也可以选，不取决于几点钟
      - system（跟随系统）不锁死明暗，跟着操作系统走，换设备时观感一致，也不用自己切换
    `),
  sidebar: z
    .enum(LAYOUT_VARIANT_IDS)
    .optional()
    .describe(`侧边栏形态：
      - inset（内嵌）把侧栏收进内容画布里，四周留白，层次像一张卡片工作台
      - floating（悬浮）让侧栏浮在页面上、和内容分开，内容画布更突出，导航也更轻
      - sidebar（经典）贴着屏幕边缘拉满全高，锚点稳定，层级深时更好找路
    `),
  layout: z
    .enum(LAYOUT_PRESET_IDS)
    .optional()
    .describe(`布局（侧栏展开程度）：
      - default（默认）把侧栏完全展开，图标和文字一起显示，菜单名一目了然
      - icon（紧凑）只留图标，内容区更宽，熟路之后仍能快速跳转
      - offcanvas（完整收起）把侧栏整块移出画布，需要时再唤出，对着宽表或画布时更专注
    `),
  baseColor: z
    .enum(BASE_THEME_IDS)
    .optional()
    .describe(`基础色（背景、文字、边框等底色）：
      - slate（板岩灰）是偏冷的蓝灰底，沉稳理智，科技感清晰
      - neutral（中性灰）几乎没有色偏，纯粹中性、极简现代，色彩不会抢过内容
      - stone（石板灰）带着暖木质和泥土感，温馨自然，质朴偏人文
      - zinc（锌灰）是偏冷的金属灰，硬朗冷静，工业感利落
      - mauve（紫灰）铺一层优雅淡紫，精致柔和，气质偏高雅
      - olive（橄榄灰）是自然的橄榄绿底，平静稳重，带着一点生态气息
      - mist（雾灰）像清晨薄雾的淡冷蓝灰，柔滑轻盈，刺激更低
      - taupe（灰褐色）是温暖的大地木质重色，稳重复古，档次感更强
    `),
  brandColor: z
    .enum(ACCENT_THEME_IDS)
    .optional()
    .describe(`品牌主题色（主按钮、链接、强调色）：
      - slate（板岩灰）用克制的冷蓝灰做强调，专业而不抢眼
      - neutral（中性色）不另铺强调色，按钮和链接沿用当前基础色，几乎没有色彩情绪
      - amber（琥珀黄）暖而醒目，能量感强，容易把视线拉到焦点上
      - blue（蓝色）专业、信任、稳重，是最常见的商务强调色
      - cyan（青色）清爽而偏科技，前沿感强
      - emerald（翡翠绿）浓郁、高级，带着成长感
      - fuchsia（洋红）时尚大胆，视觉冲击力强
      - green（绿色）让人联想到安全、健康和完成
      - indigo（靛蓝）深沉复古，显得更睿智
      - lime（柠檬绿）饱和度高、潮酷前卫，暗色界面里会更刺眼
      - orange（橙色）活力、热情，创造力外露
      - pink（粉红）柔和亲切，显得更年轻
      - purple（紫色）神秘高贵，创意感强
      - red（红色）紧迫热烈，攻击性也强，做全局主色会显得过于咄咄逼人
      - rose（玫瑰红）亮丽浪漫，精致感更足
      - sky（天蓝）明亮开阔，自由度高
      - teal（水鸭绿）典雅深邃，气质平静
      - violet（紫罗兰）优雅梦幻，更灵动
      - yellow（明黄）阳光明亮，警示感强，暗色下容易刺眼，做全局主色要谨慎
    `),
  font: z
    .enum(FONT_THEME_IDS)
    .optional()
    .describe(`系统正文字体：
      - geist（Geist）是现代几何无衬线，清晰中性，屏幕上好读
      - inter（Inter）专为屏幕排字，小字号仍清楚，长表单和高密度文字不糊
      - noto-sans（Noto Sans）覆盖的语言很广，中西混排稳定
      - nunito-sans（Nunito Sans）圆润友好，亲和力强
      - figtree（Figtree）几何简洁，带一点活泼
      - roboto（Roboto）系统感强，中性偏机械
      - raleway（Raleway）细长优雅，标题表现力更好
      - dm-sans（DM Sans）低对比的几何无衬线，干净克制
      - public-sans（Public Sans）端正可读，带着政务和公共服务的气质
      - outfit（Outfit）几何现代，标题更有力量
      - oxanium（Oxanium）科技方正，带一点游戏感
      - manrope（Manrope）半圆几何，现代而亲和
      - space-grotesk（Space Grotesk）太空时代的几何无衬线，辨识度高
      - montserrat（Montserrat）都市几何，品牌海报感强
      - ibm-plex-sans（IBM Plex Sans）企业工程感，专业冷静
      - source-sans-3（Source Sans 3）偏新闻和阅读，长文更清晰
      - instrument-sans（Instrument Sans）当代编辑感，设计工具气质更浓
      - jetbrains-mono（JetBrains Mono）是编程等宽，字符区分明确，代码和日志更好认
      - geist-mono（Geist Mono）是现代等宽，和 Geist 无衬线同一家族
      - noto-serif（Noto Serif）是多语言衬线，正式，阅读感强
      - roboto-slab（Roboto Slab）是板衬线，稳重而现代
      - merriweather（Merriweather）为屏幕长文优化，读起来更舒服
      - lora（Lora）书法感适中，带着人文温度
      - playfair-display（Playfair Display）高对比展示衬线，戏剧性和奢侈感强，大段正文会偏累
      - eb-garamond（EB Garamond）古典书籍衬线，学术和文学气质更重
      - instrument-serif（Instrument Serif）当代编辑衬线，精致但不古老
    `),
  style: z
    .enum(STYLE_THEME_IDS)
    .optional()
    .describe(`界面样式（圆角、间距与造型密度）：
      - nova（Nova）收紧内边距和间距，布局紧凑，专业硬朗
      - vega（Vega）是经典 shadcn/ui 外观，标准圆角，平衡耐看
      - maia（Maia）柔和大圆角，间距宽裕，亲切轻松
      - lyra（Lyra）方正锐利、零圆角，硬朗冷静
      - mira（Mira）把密度再往上推，单位面积能放下更多信息
      - luma（Luma）现代精致，流体感强，圆角偏大
      - sera（Sera）硬朗无圆角，更像编辑和排版界面
      - rhea（Rhea）是更紧凑的流体造型，胶囊圆角，高效现代
    `),
  rationale: z
    .string()
    .optional()
    .describe('用一两句话说明本次选择理由，供用户理解；不要复述选项清单')
})

function resolveLayoutPreset(open: boolean, collapsible: Collapsible): LayoutPreset {
  if (open) return 'default'
  if (collapsible === 'icon' || collapsible === 'offcanvas') return collapsible
  return 'default'
}

function applyLayoutChange(
  layout: LayoutPreset,
  setOpen: (open: boolean) => void,
  setCollapsible: (collapsible: Collapsible) => void
) {
  if (layout === 'default') {
    setOpen(true)
    return
  }
  setOpen(false)
  setCollapsible(layout)
}

export function useAppearanceTool() {
  const { theme, setTheme, resolvedTheme, defaultTheme } = useTheme()
  const { baseColor, setBaseColor, defaultBaseColor } = useBaseColor()
  const { brandColor, setBrandColor, defaultBrandColor } = useBrandColor()
  const { font, setFont, defaultFont } = useFont()
  const { style, setStyle, defaultStyle } = useUiStyle()
  const { variant, setVariant, collapsible, setCollapsible, defaultVariant, defaultCollapsible } =
    useLayout()
  const { open, setOpen } = useSidebar()

  const layout = resolveLayoutPreset(open, collapsible)
  const current = {
    themeMode: theme,
    resolvedTheme,
    baseColor,
    brandColor,
    font,
    style,
    sidebar: variant,
    layout
  }
  const defaults = {
    themeMode: defaultTheme,
    baseColor: defaultBaseColor,
    brandColor: defaultBrandColor,
    font: defaultFont,
    style: defaultStyle,
    sidebar: defaultVariant,
    layout: resolveLayoutPreset(true, defaultCollapsible)
  }

  useAgentContext({
    description: '当前界面外观。用户要求更改或推荐时调用 appearance；可一次传入多项。',
    value: { current }
  })

  useAgentContext({
    description:
      '系统默认外观。用户要求恢复默认、重置主题或一键还原时，把本对象字段原样作为 appearance 参数传入，不要猜测默认值。全部还原传入全部字段；只还原某一项则只传入该项。',
    value: { defaults }
  })

  useFrontendTool({
    name: 'appearance',
    description: appearanceDescription,
    parameters: appearanceSchema,
    handler: async ({
      themeMode,
      baseColor,
      brandColor,
      font,
      style,
      sidebar,
      layout,
      rationale
    }) => {
      const hasPatch = Boolean(
        themeMode || baseColor || brandColor || font || style || sidebar || layout
      )
      if (!hasPatch) {
        return { status: 'noop' }
      }

      if (themeMode) setTheme(themeMode)
      if (baseColor) setBaseColor(baseColor)
      if (brandColor) setBrandColor(brandColor)
      if (font) setFont(font)
      if (style) setStyle(style)
      if (sidebar) setVariant(sidebar)
      if (layout) applyLayoutChange(layout, setOpen, setCollapsible)

      return { status: 'success', rationale }
    }
  })
}
