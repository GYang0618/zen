import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useSidebar
} from '@zen/ui'

import {
  IconLayoutCompact,
  IconLayoutDefault,
  IconLayoutFull,
  IconSidebarFloating,
  IconSidebarInset,
  IconSidebarSidebar,
  IconThemeDark,
  IconThemeLight,
  IconThemeSystem
} from '@/components/icons'
import { useBaseColor } from '@/context/base-color-provider'
import { useBrandColor } from '@/context/brand-color-provider'
import { useFont } from '@/context/font-provider'
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'
import { useUiStyle } from '@/context/ui-style-provider'

import {
  AppearanceIconRadio,
  BASE_COLOR_OPTIONS,
  BaseColorRadio,
  BRAND_COLOR_OPTIONS,
  BrandColorRadio,
  FONT_OPTIONS,
  STYLE_OPTIONS
} from './appearance-presets'

import type { BaseColor } from '@/context/base-color-provider'
import type { BrandColor } from '@/context/brand-color-provider'
import type { Font } from '@/context/font-provider'
import type { Collapsible } from '@/context/layout-provider'
import type { UiStyle } from '@/context/ui-style-provider'
import type { AppearanceOption } from './appearance-presets'

const THEME_MODE_OPTIONS: AppearanceOption[] = [
  { value: 'light', label: '亮色', icon: IconThemeLight },
  { value: 'dark', label: '暗色', icon: IconThemeDark },
  { value: 'system', label: '跟随系统', icon: IconThemeSystem }
]

const SIDEBAR_OPTIONS: AppearanceOption[] = [
  { value: 'inset', label: '内嵌', icon: IconSidebarInset },
  { value: 'floating', label: '悬浮', icon: IconSidebarFloating },
  { value: 'sidebar', label: '经典', icon: IconSidebarSidebar }
]

const LAYOUT_OPTIONS: AppearanceOption[] = [
  { value: 'default', label: '默认', icon: IconLayoutDefault },
  { value: 'icon', label: '紧凑', icon: IconLayoutCompact },
  { value: 'offcanvas', label: '完整布局', icon: IconLayoutFull }
]

export function ThemeModeRadioGroup() {
  const { theme, setTheme } = useTheme()

  return (
    <RadioGroup value={theme} onValueChange={setTheme} className="flex max-w-xl gap-4">
      {THEME_MODE_OPTIONS.map((option) => (
        <AppearanceIconRadio key={option.value} name="theme" option={option} tintIcon={false} />
      ))}
    </RadioGroup>
  )
}

export function BaseColorRadioGroup() {
  const { baseColor, setBaseColor } = useBaseColor()

  return (
    <RadioGroup
      value={baseColor}
      onValueChange={(value) => setBaseColor(value as BaseColor)}
      className="flex max-w-3xl flex-wrap gap-4"
    >
      {BASE_COLOR_OPTIONS.map((option) => (
        <BaseColorRadio key={option.value} option={option} />
      ))}
    </RadioGroup>
  )
}

export function BrandColorRadioGroup() {
  const { brandColor, setBrandColor } = useBrandColor()

  return (
    <RadioGroup
      value={brandColor}
      onValueChange={(value) => setBrandColor(value as BrandColor)}
      className="flex max-w-3xl flex-wrap gap-4"
    >
      {BRAND_COLOR_OPTIONS.map((option) => (
        <BrandColorRadio key={option.value} option={option} />
      ))}
    </RadioGroup>
  )
}

export function FontSelect() {
  const { font, setFont } = useFont()
  const selected = FONT_OPTIONS.find((option) => option.value === font)

  return (
    <Select value={font} onValueChange={(value) => setFont(value as Font)}>
      <SelectTrigger className="w-56" style={{ fontFamily: selected?.family }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {FONT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} style={{ fontFamily: option.family }}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function StyleRadioGroup() {
  const { style, setStyle } = useUiStyle()

  return (
    <RadioGroup
      value={style}
      onValueChange={(value) => setStyle(value as UiStyle)}
      className="grid w-full grid-cols-3 gap-2"
    >
      {STYLE_OPTIONS.map((option) => (
        <FieldLabel key={option.value} htmlFor={option.value}>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{option.label}</FieldTitle>
              <FieldDescription className="min-h-10 line-clamp-2 group-has-data-horizontal/field:text-wrap">
                {option.description}
              </FieldDescription>
            </FieldContent>
            <RadioGroupItem value={option.value} id={option.value} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}

export function SidebarVariantRadioGroup() {
  const { variant, setVariant } = useLayout()

  return (
    <RadioGroup value={variant} onValueChange={setVariant} className="flex max-w-xl gap-4">
      {SIDEBAR_OPTIONS.map((option) => (
        <AppearanceIconRadio key={option.value} name="sidebar" option={option} />
      ))}
    </RadioGroup>
  )
}

export function LayoutRadioGroup() {
  const { collapsible, setCollapsible } = useLayout()
  const { open, setOpen } = useSidebar()
  const layoutValue = open ? 'default' : collapsible

  return (
    <RadioGroup
      value={layoutValue}
      onValueChange={(value) => {
        if (value === 'default') {
          setOpen(true)
          return
        }
        setOpen(false)
        setCollapsible(value as Collapsible)
      }}
      className="flex max-w-xl gap-4"
    >
      {LAYOUT_OPTIONS.map((option) => (
        <AppearanceIconRadio key={option.value} name="layout" option={option} />
      ))}
    </RadioGroup>
  )
}
