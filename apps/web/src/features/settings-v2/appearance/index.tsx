import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
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

import { SectionContent } from '../components/section-content'

export function SettingsAppearance() {
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

  const themeModeOptions = [
    { value: 'light', label: '亮色', icon: IconThemeLight },
    { value: 'dark', label: '暗色', icon: IconThemeDark },
    { value: 'system', label: '跟随系统', icon: IconThemeSystem }
  ]

  const sidebarOptions = [
    { value: 'inset', label: '内嵌', icon: IconSidebarInset },
    { value: 'floating', label: '悬浮', icon: IconSidebarFloating },
    { value: 'sidebar', label: '经典', icon: IconSidebarSidebar }
  ]

  const layoutOptions = [
    { value: 'default', label: '默认', icon: IconLayoutDefault },
    { value: 'icon', label: '紧凑', icon: IconLayoutCompact },
    { value: 'offcanvas', label: '完整布局', icon: IconLayoutFull }
  ]

  return (
    <SectionContent>
      <FieldGroup>
        <Field className="justify-between" orientation="horizontal">
          <div>
            <FieldLabel>字体</FieldLabel>
            <FieldDescription>字体描述</FieldDescription>
          </div>
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
          <div className="flex gap-4">
            {themeModeOptions.map((option) => (
              <div key={option.value} className="flex flex-col items-center gap-1">
                <div className="border-2 border-border/0 hover:border-accent-foreground rounded-lg transition-all duration-200 ease-in">
                  <option.icon className="h-auto w-50" />
                </div>
                <span className="text-xs">{option.label}</span>
              </div>
            ))}
          </div>
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
