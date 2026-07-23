import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@zen/ui'
import { Languages } from 'lucide-react'

import { useI18nStore } from '@/stores/i18n'

export function LocaleSwitch() {
  const locale = useI18nStore((state) => state.locale)
  const setLocale = useI18nStore((state) => state.setLocale)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="scale-95 rounded-full" aria-label="切换语言">
          <Languages className="size-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale('zh-CN')}>
          简体中文
          <span className={cn('ms-auto text-xs', locale !== 'zh-CN' && 'invisible')}>✓</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en-US')}>
          English
          <span className={cn('ms-auto text-xs', locale !== 'en-US' && 'invisible')}>✓</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
