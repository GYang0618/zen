import { RadioGroup } from '@zen/ui'

import { useBaseColor } from '@/context/base-color-provider'

import { ColorSwatchRadio } from './color-swatch-radio'

import type { BaseColor } from '@/context/base-color-provider'
import type { BaseColorOption } from '../types'

/** Base Color：系统 Slate + 官方预设 */
const BASE_COLOR_OPTIONS: BaseColorOption[] = [
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

export function BaseColorRadioGroup() {
  const { baseColor, setBaseColor } = useBaseColor()

  return (
    <RadioGroup
      value={baseColor}
      onValueChange={(value) => setBaseColor(value as BaseColor)}
      className="flex max-w-3xl flex-wrap gap-4"
    >
      {BASE_COLOR_OPTIONS.map((option) => (
        <ColorSwatchRadio key={option.value} name="base-color" option={option} />
      ))}
    </RadioGroup>
  )
}
