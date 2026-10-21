import { RadioGroup, useSidebar } from '@zen/ui'

import { IconLayoutCompact, IconLayoutDefault, IconLayoutFull } from '@/components/icons'
import { useLayout } from '@/context/layout-provider'

import { AppearanceIconRadio } from './appearanceIcon-radio'

import type { Collapsible } from '@/context/layout-provider'
import type { AppearanceOption } from '../types'

const LAYOUT_OPTIONS: AppearanceOption[] = [
  { value: 'default', label: '默认', icon: IconLayoutDefault },
  { value: 'icon', label: '紧凑', icon: IconLayoutCompact },
  { value: 'offcanvas', label: '完整布局', icon: IconLayoutFull }
]

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
