import { RadioGroup } from '@zen/ui'

import { useBrandColor } from '@/context/brand-color-provider'

import { ColorSwatchRadio } from './color-swatch-radio'

import type { BrandColor } from '@/context/brand-color-provider'
import type { BrandColorOption } from '../types'

/** Theme（accent）：系统板岩灰 + 官方预设；中性色 = 沿用基础色 */
const BRAND_COLOR_OPTIONS: BrandColorOption[] = [
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

export function BrandColorRadioGroup() {
  const { brandColor, setBrandColor } = useBrandColor()

  return (
    <RadioGroup
      value={brandColor}
      onValueChange={(value) => setBrandColor(value as BrandColor)}
      className="flex max-w-3xl flex-wrap gap-4"
    >
      {BRAND_COLOR_OPTIONS.map((option) => (
        <ColorSwatchRadio key={option.value} name="brand-color" option={option} />
      ))}
    </RadioGroup>
  )
}
