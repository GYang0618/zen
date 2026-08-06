import {
  Field,
  FieldGroup,
  FieldLabel,
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
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'

import { SectionContent } from '../components/section-content'

import type { ReactElement, SVGProps } from 'react'
import type { Collapsible } from '@/context/layout-provider'

type AppearanceOption = {
  value: string
  label: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

function AppearanceIconRadio({
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

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme()
  const { variant, setVariant, collapsible, setCollapsible } = useLayout()
  const { open, setOpen } = useSidebar()

  const layoutValue = open ? 'default' : collapsible

  const presetFonts = [
    {
      label: '阿里巴巴普惠体',
      value: 'AlibabaPuHuiTi'
    },
    {
      label: '思源黑体',
      value: 'SiYuanHeiTi'
    },
    {
      label: '系统默认',
      value: 'System'
    }
  ]

  const themeModeOptions: AppearanceOption[] = [
    { value: 'light', label: '亮色', icon: IconThemeLight },
    { value: 'dark', label: '暗色', icon: IconThemeDark },
    { value: 'system', label: '跟随系统', icon: IconThemeSystem }
  ]

  const sidebarOptions: AppearanceOption[] = [
    { value: 'inset', label: '内嵌', icon: IconSidebarInset },
    { value: 'floating', label: '悬浮', icon: IconSidebarFloating },
    { value: 'sidebar', label: '经典', icon: IconSidebarSidebar }
  ]

  const layoutOptions: AppearanceOption[] = [
    { value: 'default', label: '默认', icon: IconLayoutDefault },
    { value: 'icon', label: '紧凑', icon: IconLayoutCompact },
    { value: 'offcanvas', label: '完整布局', icon: IconLayoutFull }
  ]

  return (
    <SectionContent>
      <FieldGroup>
        <Field>
          <FieldLabel>字体</FieldLabel>
          <Select defaultValue="System">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup className="w-50">
                {presetFonts.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>主题</FieldLabel>
          <RadioGroup value={theme} onValueChange={setTheme} className="flex max-w-xl gap-4">
            {themeModeOptions.map((option) => (
              <AppearanceIconRadio
                key={option.value}
                name="theme"
                option={option}
                tintIcon={false}
              />
            ))}
          </RadioGroup>
        </Field>

        <Field>
          <FieldLabel>侧边栏</FieldLabel>
          <RadioGroup value={variant} onValueChange={setVariant} className="flex max-w-xl gap-4">
            {sidebarOptions.map((option) => (
              <AppearanceIconRadio key={option.value} name="sidebar" option={option} />
            ))}
          </RadioGroup>
        </Field>

        <Field>
          <FieldLabel>布局</FieldLabel>
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
            {layoutOptions.map((option) => (
              <AppearanceIconRadio key={option.value} name="layout" option={option} />
            ))}
          </RadioGroup>
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
