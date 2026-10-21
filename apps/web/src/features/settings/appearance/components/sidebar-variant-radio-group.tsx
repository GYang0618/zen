import { RadioGroup } from '@zen/ui'

import { IconSidebarFloating, IconSidebarInset, IconSidebarSidebar } from '@/components/icons'
import { useLayout } from '@/context/layout-provider'

import { AppearanceIconRadio } from './appearanceIcon-radio'

import type { AppearanceOption } from '../types'

const SIDEBAR_OPTIONS: AppearanceOption[] = [
  { value: 'inset', label: '内嵌', icon: IconSidebarInset },
  { value: 'floating', label: '悬浮', icon: IconSidebarFloating },
  { value: 'sidebar', label: '经典', icon: IconSidebarSidebar }
]

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
