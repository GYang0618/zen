import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem
} from '@zen/ui'

import { useUiStyle } from '@/context/ui-style-provider'

import type { UiStyle } from '@/context/ui-style-provider'
import type { StyleOption } from '../types'

const STYLE_OPTIONS: StyleOption[] = [
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
