import type { ReactElement, SVGProps } from 'react'
import type { BaseColor } from '@/context/base-color-provider'
import type { BrandColor } from '@/context/brand-color-provider'
import type { Font } from '@/context/font-provider'
import type { UiStyle } from '@/context/ui-style-provider'

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
