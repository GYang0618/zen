import { RadioGroup } from '@zen/ui'

import { IconThemeDark, IconThemeLight, IconThemeSystem } from '@/components/icons'
import { useTheme } from '@/context/theme-provider'

import { AppearanceIconRadio } from './appearanceIcon-radio'

import type { AppearanceOption } from '../types'

const THEME_MODE_OPTIONS: AppearanceOption[] = [
  { value: 'light', label: '亮色', icon: IconThemeLight },
  { value: 'dark', label: '暗色', icon: IconThemeDark },
  { value: 'system', label: '跟随系统', icon: IconThemeSystem }
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
