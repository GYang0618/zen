import { Field, FieldDescription, FieldGroup, FieldLabel } from '@zen/ui'

import { SectionContent } from '../components/section-content'
import {
  BaseColorRadioGroup,
  BrandColorRadioGroup,
  FontSelect,
  LayoutRadioGroup,
  SidebarVariantRadioGroup,
  StyleRadioGroup,
  ThemeModeRadioGroup
} from './components/appearance-controls'

export function SettingsAppearance() {
  return (
    <SectionContent>
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
      </FieldGroup>
    </SectionContent>
  )
}
