import { cn, RadioGroupItem } from '@zen/ui'
import { Check } from 'lucide-react'

import type { BaseColor } from '@/context/base-color-provider'
import type { BrandColor } from '@/context/brand-color-provider'
import type { Font } from '@/context/font-provider'
import type { UiStyle } from '@/context/ui-style-provider'
import type { ReactElement, SVGProps } from 'react'

export type AppearanceOption = {
  value: string
  label: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

export type ColorSwatchOption<T extends string = string> = {
  value: T
  label: string
  /** 色调特征描述，暂不展示，供后续布局复用 */
  description: string
  /** 适用场景，暂不展示，供后续布局复用 */
  scenarios: string
  swatchClassName: string
  checkClassName: string
}

export type BrandColorOption = ColorSwatchOption<BrandColor>
export type BaseColorOption = ColorSwatchOption<BaseColor>

export type StyleOption = {
  value: UiStyle
  label: string
  description: string
}

export type FontOption = {
  value: Font
  label: string
  /** 与官方 font-definitions.family 一致，用于下拉预览 */
  family: string
}

export type RadiusOption = {
  value: string
  label: string
  previewClassName: string
}

/** Base Color：系统 Slate + 官方预设 */
export const BASE_COLOR_OPTIONS: BaseColorOption[] = [
  {
    value: 'slate',
    label: '板岩灰',
    description: '偏冷蓝灰底调，沉稳理智、科技清晰',
    scenarios: '技术文档、开发者平台、数据分析',
    swatchClassName: 'bg-[oklch(0.208_0.042_265.755)] dark:bg-[oklch(0.929_0.013_255.508)]',
    checkClassName: 'text-white dark:text-[oklch(0.208_0.042_265.755)]'
  },
  {
    value: 'neutral',
    label: '中性灰',
    description: '绝对无偏色，纯粹中性、极简现代',
    scenarios: '通用型 UI、注重内容本身的设计',
    swatchClassName: 'bg-neutral-900 dark:bg-neutral-100',
    checkClassName: 'text-white dark:text-neutral-900'
  },
  {
    value: 'stone',
    label: '石板灰',
    description: '偏暖木质泥土感，温馨自然、质朴人文',
    scenarios: '知识库、写作平台、生活类应用',
    swatchClassName: 'bg-stone-700 dark:bg-stone-300',
    checkClassName: 'text-white dark:text-stone-900'
  },
  {
    value: 'zinc',
    label: '锌灰',
    description: '偏冷金属性灰调，硬朗冷静、工业利落',
    scenarios: '极客工具、云原生管理后台',
    swatchClassName: 'bg-zinc-900 dark:bg-zinc-100',
    checkClassName: 'text-white dark:text-zinc-900'
  },
  {
    value: 'mauve',
    label: '紫灰',
    description: '优雅淡紫底调，高雅精致、柔和高级',
    scenarios: '时尚女性、艺术设计类产品',
    swatchClassName: 'bg-[#5c4d5e] dark:bg-[#c9bcc9]',
    checkClassName: 'text-white dark:text-[#2a222b]'
  },
  {
    value: 'olive',
    label: '橄榄灰',
    description: '自然橄榄绿底调，生态自然、平静稳重',
    scenarios: '环保、农业、户外健康管理',
    swatchClassName: 'bg-[#555746] dark:bg-[#c8c9b8]',
    checkClassName: 'text-white dark:text-[#2a2b22]'
  },
  {
    value: 'mist',
    label: '雾灰',
    description: '清晨薄雾般淡冷蓝灰，柔滑轻盈、宁静高质',
    scenarios: '阅读器、禅意冥想、高级医疗',
    swatchClassName: 'bg-[#4d5a63] dark:bg-[#bcc6cd]',
    checkClassName: 'text-white dark:text-[#22282b]'
  },
  {
    value: 'taupe',
    label: '灰褐色',
    description: '温暖大地木质重色调，稳重复古、高档奢华',
    scenarios: '高端定制、奢侈品、酒类',
    swatchClassName: 'bg-[#5c534c] dark:bg-[#c9c2bb]',
    checkClassName: 'text-white dark:text-[#2b2722]'
  }
]

/** Theme（accent）：系统板岩灰 + 官方预设；中性色 = 沿用基础色 */
export const BRAND_COLOR_OPTIONS: BrandColorOption[] = [
  {
    value: 'slate',
    label: '板岩灰',
    description: '偏冷蓝灰底调，沉稳理智、科技清晰',
    scenarios: '技术文档、开发者平台、数据分析',
    swatchClassName: 'bg-[oklch(0.208_0.042_265.755)] dark:bg-[oklch(0.929_0.013_255.508)]',
    checkClassName: 'text-white dark:text-[oklch(0.208_0.042_265.755)]'
  },
  {
    value: 'neutral',
    label: '中性色',
    description: '黑白灰高对比度，无额外色彩情绪',
    scenarios: '极简主义、高端黑白潮牌',
    swatchClassName: 'bg-neutral-900 dark:bg-neutral-100',
    checkClassName: 'text-white dark:text-neutral-900'
  },
  {
    value: 'amber',
    label: '琥珀黄',
    description: '温暖、醒目、富有能量',
    scenarios: '提示信息、警示、积分奖励',
    swatchClassName: 'bg-amber-600',
    checkClassName: 'text-white'
  },
  {
    value: 'blue',
    label: '蓝色',
    description: '专业、信任、稳重',
    scenarios: '经典商务、金融 SaaS、企业应用',
    swatchClassName: 'bg-blue-600',
    checkClassName: 'text-white'
  },
  {
    value: 'cyan',
    label: '青色',
    description: '科技、前沿、清爽',
    scenarios: 'AI 智能、数据可视化',
    swatchClassName: 'bg-cyan-600',
    checkClassName: 'text-white'
  },
  {
    value: 'emerald',
    label: '翡翠绿',
    description: '浓郁、高级、成长',
    scenarios: '投资理财、高品质消费、成长数据',
    swatchClassName: 'bg-emerald-600',
    checkClassName: 'text-white'
  },
  {
    value: 'fuchsia',
    label: '洋红',
    description: '时尚、大胆、视觉冲击力强',
    scenarios: '音乐、社交、流行文化',
    swatchClassName: 'bg-fuchsia-600',
    checkClassName: 'text-white'
  },
  {
    value: 'green',
    label: '绿色',
    description: '安全、健康、成功',
    scenarios: '标准成功态、完成指标、生态能源',
    swatchClassName: 'bg-green-600',
    checkClassName: 'text-white'
  },
  {
    value: 'indigo',
    label: '靛蓝',
    description: '深沉、复古、睿智',
    scenarios: '极客工具、代码编辑器、学术科研',
    swatchClassName: 'bg-indigo-600',
    checkClassName: 'text-white'
  },
  {
    value: 'lime',
    label: '柠檬绿',
    description: '高饱和、潮酷、前卫',
    scenarios: '新潮科技、潮牌、音视频应用',
    swatchClassName: 'bg-lime-500',
    checkClassName: 'text-lime-950'
  },
  {
    value: 'orange',
    label: '橙色',
    description: '活力、热情、创造力',
    scenarios: '电商促销、运动健身、创新产品',
    swatchClassName: 'bg-orange-500',
    checkClassName: 'text-white'
  },
  {
    value: 'pink',
    label: '粉红',
    description: '柔和、亲切、年轻',
    scenarios: '社区社交、个人护理、女性消费',
    swatchClassName: 'bg-pink-600',
    checkClassName: 'text-white'
  },
  {
    value: 'purple',
    label: '紫色',
    description: '神秘、高贵、创意',
    scenarios: 'AI 艺术、高阶订阅、智慧化组件',
    swatchClassName: 'bg-purple-600',
    checkClassName: 'text-white'
  },
  {
    value: 'red',
    label: '红色',
    description: '紧迫、危险、热烈',
    scenarios: '危险操作、删除确认、错误提示',
    swatchClassName: 'bg-red-600',
    checkClassName: 'text-white'
  },
  {
    value: 'rose',
    label: '玫瑰红',
    description: '亮丽、浪漫、精致',
    scenarios: '社交互动、点赞关注、高端零售',
    swatchClassName: 'bg-rose-600',
    checkClassName: 'text-white'
  },
  {
    value: 'sky',
    label: '天蓝',
    description: '明亮、开阔、自由',
    scenarios: '协作工具、云服务、天气应用',
    swatchClassName: 'bg-sky-500',
    checkClassName: 'text-white'
  },
  {
    value: 'teal',
    label: '水鸭绿',
    description: '典雅、深邃、平静',
    scenarios: '医疗健康、专业咨询、高端仪表盘',
    swatchClassName: 'bg-teal-600',
    checkClassName: 'text-white'
  },
  {
    value: 'violet',
    label: '紫罗兰',
    description: '优雅、梦幻、灵动',
    scenarios: '设计软件、创意平台',
    swatchClassName: 'bg-violet-600',
    checkClassName: 'text-white'
  },
  {
    value: 'yellow',
    label: '明黄',
    description: '阳光、明亮、警示',
    scenarios: '重点关注、收藏夹、警示状态',
    swatchClassName: 'bg-yellow-400',
    checkClassName: 'text-yellow-950'
  }
]

/** shadcn/ui 官方 Style 预设（Nova 为默认，置顶） */
export const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'nova',
    label: 'Nova',
    description: '减小内边距与间距，布局紧凑、专业硬朗'
  },
  {
    value: 'vega',
    label: 'Vega',
    description: '经典 shadcn/ui 外观，标准圆角，平衡耐看'
  },
  {
    value: 'maia',
    label: 'Maia',
    description: '柔和大圆角，间距宽裕，亲切轻松'
  },
  {
    value: 'lyra',
    label: 'Lyra',
    description: '方正锐利、零圆角，适合等宽/硬朗风格'
  },
  {
    value: 'mira',
    label: 'Mira',
    description: '紧凑高密度，适合信息密集界面'
  },
  {
    value: 'luma',
    label: 'Luma',
    description: '现代精致、流体感，圆角偏大'
  },
  {
    value: 'sera',
    label: 'Sera',
    description: '硬朗无圆角，偏编辑/排版气质'
  },
  {
    value: 'rhea',
    label: 'Rhea',
    description: '更紧凑的 Luma，胶囊圆角、高效现代'
  }
]

/** Font：官方 create 全量预设（Geist 为 radix-nova 默认，置顶） */
export const FONT_OPTIONS: FontOption[] = [
  { value: 'geist', label: 'Geist', family: "'Geist Variable', sans-serif" },
  { value: 'inter', label: 'Inter', family: "'Inter Variable', sans-serif" },
  { value: 'noto-sans', label: 'Noto Sans', family: "'Noto Sans Variable', sans-serif" },
  { value: 'nunito-sans', label: 'Nunito Sans', family: "'Nunito Sans Variable', sans-serif" },
  { value: 'figtree', label: 'Figtree', family: "'Figtree Variable', sans-serif" },
  { value: 'roboto', label: 'Roboto', family: "'Roboto Variable', sans-serif" },
  { value: 'raleway', label: 'Raleway', family: "'Raleway Variable', sans-serif" },
  { value: 'dm-sans', label: 'DM Sans', family: "'DM Sans Variable', sans-serif" },
  { value: 'public-sans', label: 'Public Sans', family: "'Public Sans Variable', sans-serif" },
  { value: 'outfit', label: 'Outfit', family: "'Outfit Variable', sans-serif" },
  { value: 'oxanium', label: 'Oxanium', family: "'Oxanium Variable', sans-serif" },
  { value: 'manrope', label: 'Manrope', family: "'Manrope Variable', sans-serif" },
  {
    value: 'space-grotesk',
    label: 'Space Grotesk',
    family: "'Space Grotesk Variable', sans-serif"
  },
  { value: 'montserrat', label: 'Montserrat', family: "'Montserrat Variable', sans-serif" },
  {
    value: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: "'IBM Plex Sans Variable', sans-serif"
  },
  {
    value: 'source-sans-3',
    label: 'Source Sans 3',
    family: "'Source Sans 3 Variable', sans-serif"
  },
  {
    value: 'instrument-sans',
    label: 'Instrument Sans',
    family: "'Instrument Sans Variable', sans-serif"
  },
  {
    value: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono Variable', monospace"
  },
  { value: 'geist-mono', label: 'Geist Mono', family: "'Geist Mono Variable', monospace" },
  { value: 'noto-serif', label: 'Noto Serif', family: "'Noto Serif Variable', serif" },
  { value: 'roboto-slab', label: 'Roboto Slab', family: "'Roboto Slab Variable', serif" },
  {
    value: 'merriweather',
    label: 'Merriweather',
    family: "'Merriweather Variable', serif"
  },
  { value: 'lora', label: 'Lora', family: "'Lora Variable', serif" },
  {
    value: 'playfair-display',
    label: 'Playfair Display',
    family: "'Playfair Display Variable', serif"
  },
  { value: 'eb-garamond', label: 'EB Garamond', family: "'EB Garamond Variable', serif" },
  { value: 'instrument-serif', label: 'Instrument Serif', family: "'Instrument Serif', serif" }
]

export function AppearanceIconRadio({
  name,
  option,
  tintIcon = true
}: {
  name: string
  option: AppearanceOption
  tintIcon?: boolean
}) {
  const optionId = `${name}-${option.value}`

  return (
    <label
      htmlFor={optionId}
      className="group/appearance-option flex cursor-pointer flex-col items-center gap-1.5"
    >
      <div className="rounded-lg border-2 transition-all duration-200 ease-in group-has-data-checked/appearance-option:border-primary group-has-data-checked/appearance-option:bg-primary/5 dark:group-has-data-checked/appearance-option:border-primary/30 dark:group-has-data-checked/appearance-option:bg-primary/10">
        <option.icon
          className={
            tintIcon
              ? 'h-auto w-45 fill-muted-foreground stroke-muted-foreground group-has-data-checked/appearance-option:fill-primary group-has-data-checked/appearance-option:stroke-primary'
              : 'h-auto w-45'
          }
        />
      </div>
      <span className="text-xs font-normal">{option.label}</span>
      <RadioGroupItem value={option.value} id={optionId} className="sr-only" />
    </label>
  )
}

function ColorSwatchRadio({
  name,
  option
}: {
  name: string
  option: ColorSwatchOption
}) {
  const optionId = `${name}-${option.value}`

  return (
    <label
      htmlFor={optionId}
      className="group/color-swatch flex cursor-pointer flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all',
          'group-has-data-checked/color-swatch:ring-foreground',
          option.swatchClassName
        )}
        aria-hidden
      >
        <Check
          className={cn(
            'size-3.5 opacity-0 transition-opacity group-has-data-checked/color-swatch:opacity-100',
            option.checkClassName
          )}
        />
      </span>
      <span className="text-xs font-normal">{option.label}</span>
      <RadioGroupItem value={option.value} id={optionId} className="sr-only" />
    </label>
  )
}

export function BaseColorRadio({ option }: { option: BaseColorOption }) {
  return <ColorSwatchRadio name="base-color" option={option} />
}

export function BrandColorRadio({ option }: { option: BrandColorOption }) {
  return <ColorSwatchRadio name="brand-color" option={option} />
}
