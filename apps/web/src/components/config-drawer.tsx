import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  useSidebar
} from '@zen/ui'
import { Settings } from 'lucide-react'

import { LayoutConfig, SidebarConfig, ThemeConfig } from '@/components/appearance-settings'
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'

export function ConfigDrawer() {
  const { setOpen } = useSidebar()

  const { resetTheme } = useTheme()
  const { resetLayout } = useLayout()

  const handleReset = () => {
    setOpen(true)

    resetTheme()
    resetLayout()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="打开主题设置"
          aria-describedby="config-drawer-description"
          className="rounded-full"
        >
          <Settings aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader className="pb-0 text-start">
          <SheetTitle>主题设置</SheetTitle>
          <SheetDescription id="config-drawer-description">
            调整外观和布局以适应您的偏好。
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto px-4">
          <ThemeConfig />
          <SidebarConfig />
          <LayoutConfig />
        </div>
        <SheetFooter className="gap-2">
          <Button variant="destructive" onClick={handleReset} aria-label="将所有设置重置为默认值">
            重置
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
