import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle
} from '@zen/ui'

import { SectionContent } from '../components/section-content'
import { BaseColorRadioGroup } from './components/base-color-radio-group'
import { BrandColorRadioGroup } from './components/brand-color-radio-group'
import { FontSelect } from './components/font-select'
import { LayoutRadioGroup } from './components/layout-radio-group'
import { ResetAppearanceButton } from './components/reset-appearance-button'
import { SidebarVariantRadioGroup } from './components/sidebar-variant-radio-group'
import { StyleRadioGroup } from './components/style-radio-group'
import { ThemeModeRadioGroup } from './components/theme-mode-radio-group'

export function SettingsAppearance() {
  return (
    <SectionContent actions={<ResetAppearanceButton />}>
      <FieldGroup>
        <Field>
          <FieldLabel>主题模式</FieldLabel>
          <ThemeModeRadioGroup />
        </Field>
        <Field>
          <FieldLabel>基础色</FieldLabel>
          <BaseColorRadioGroup />
          <FieldDescription>界面中背景、文本、边框等基础颜色</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>品牌主题色</FieldLabel>
          <BrandColorRadioGroup />
          <FieldDescription>系统界面风格主题颜色</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>字体</FieldLabel>
          <FontSelect />
          <FieldDescription>系统界面正文字体（与 shadcn/ui create 预设一致）</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>样式</FieldLabel>
          <StyleRadioGroup />
          <FieldDescription>系统界面的样式风格（圆角与造型密度）</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>侧边栏</FieldLabel>
          <SidebarVariantRadioGroup />
        </Field>
        <Field>
          <FieldLabel>布局</FieldLabel>
          <LayoutRadioGroup />
        </Field>
        <FieldSeparator />
        <Field orientation="responsive">
          <FieldContent>
            <FieldTitle>恢复系统默认</FieldTitle>
            <FieldDescription>
              将主题模式、基础色、品牌主题色、字体、样式、侧边栏与布局一次性重置为系统默认。
            </FieldDescription>
          </FieldContent>
          <ResetAppearanceButton />
        </Field>
      </FieldGroup>
    </SectionContent>
  )
}
