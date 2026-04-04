import {
  Button,
  cn,
  RadioGroup,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  useSidebar
} from '@zen/ui'

import { CircleCheck, RotateCcw, Settings } from 'lucide-react'
import type { ReactElement, SVGProps } from 'react'
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
import { type Collapsible, useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'

const { Item, Root: Radio } = RadioGroup

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

function SectionTitle({
  title,
  showReset = false,
  onReset,
  className
}: {
  title: string
  showReset?: boolean
  onReset?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground',
        className
      )}
    >
      {title}
      {showReset && onReset && (
        <Button size="icon" variant="secondary" className="size-4 rounded-full" onClick={onReset}>
          <RotateCcw className="size-3" />
        </Button>
      )}
    </div>
  )
}

function RadioGroupItem({
  item,
  isTheme = false
}: {
  item: {
    value: string
    label: string
    icon: (props: SVGProps<SVGSVGElement>) => ReactElement
  }
  isTheme?: boolean
}) {
  return (
    <Item
      value={item.value}
      className={cn('group outline-none', 'transition duration-200 ease-in')}
      aria-label={`选择${item.label}`}
      aria-describedby={`${item.value}-description`}
    >
      <div
        className={cn(
          'relative rounded-[6px] ring-[1px] ring-border',
          'group-data-[state=checked]:shadow-2xl group-data-[state=checked]:ring-primary',
          'group-focus-visible:ring-2'
        )}
        role="img"
        aria-hidden="false"
        aria-label={`${item.label}选项预览`}
      >
        <CircleCheck
          className={cn(
            'size-6 fill-primary stroke-white',
            'group-data-[state=unchecked]:hidden',
            'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2'
          )}
          aria-hidden="true"
        />
        <item.icon
          className={cn(
            !isTheme &&
              'fill-primary stroke-primary group-data-[state=unchecked]:fill-muted-foreground group-data-[state=unchecked]:stroke-muted-foreground'
          )}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 text-xs" id={`${item.value}-description`} aria-live="polite">
        {item.label}
      </div>
    </Item>
  )
}

function ThemeConfig() {
  const { defaultTheme, theme, setTheme } = useTheme()
  return (
    <div>
      <SectionTitle
        title="主题"
        showReset={theme !== defaultTheme}
        onReset={() => setTheme(defaultTheme)}
      />
      <Radio
        value={theme}
        onValueChange={setTheme}
        className="grid w-full max-w-md grid-cols-3 gap-4"
        aria-label="选择主题偏好"
        aria-describedby="theme-description"
      >
        {[
          {
            value: 'system',
            label: '跟随系统',
            icon: IconThemeSystem
          },
          {
            value: 'light',
            label: '亮色',
            icon: IconThemeLight
          },
          {
            value: 'dark',
            label: '暗色',
            icon: IconThemeDark
          }
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} isTheme />
        ))}
      </Radio>
      <div id="theme-description" className="sr-only">
        在系统偏好、亮色模式或暗色模式之间选择
      </div>
    </div>
  )
}

function SidebarConfig() {
  const { defaultVariant, variant, setVariant } = useLayout()
  return (
    <div className="max-md:hidden">
      <SectionTitle
        title="侧边栏"
        showReset={defaultVariant !== variant}
        onReset={() => setVariant(defaultVariant)}
      />
      <Radio
        value={variant}
        onValueChange={setVariant}
        className="grid w-full max-w-md grid-cols-3 gap-4"
        aria-label="选择侧边栏样式"
        aria-describedby="sidebar-description"
      >
        {[
          {
            value: 'inset',
            label: '内嵌',
            icon: IconSidebarInset
          },
          {
            value: 'floating',
            label: '悬浮',
            icon: IconSidebarFloating
          },
          {
            value: 'sidebar',
            label: '经典',
            icon: IconSidebarSidebar
          }
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id="sidebar-description" className="sr-only">
        在内嵌、悬浮或标准侧边栏布局之间选择
      </div>
    </div>
  )
}

function LayoutConfig() {
  const { open, setOpen } = useSidebar()
  const { defaultCollapsible, collapsible, setCollapsible } = useLayout()

  const radioState = open ? 'default' : collapsible

  return (
    <div className="max-md:hidden">
      <SectionTitle
        title="布局"
        showReset={radioState !== 'default'}
        onReset={() => {
          setOpen(true)
          setCollapsible(defaultCollapsible)
        }}
      />
      <Radio
        value={radioState}
        onValueChange={(v) => {
          if (v === 'default') {
            setOpen(true)
            return
          }
          setOpen(false)
          setCollapsible(v as Collapsible)
        }}
        className="grid w-full max-w-md grid-cols-3 gap-4"
        aria-label="选择布局样式"
        aria-describedby="layout-description"
      >
        {[
          {
            value: 'default',
            label: '默认',
            icon: IconLayoutDefault
          },
          {
            value: 'icon',
            label: '紧凑',
            icon: IconLayoutCompact
          },
          {
            value: 'offcanvas',
            label: '完整布局',
            icon: IconLayoutFull
          }
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} />
        ))}
      </Radio>
      <div id="layout-description" className="sr-only">
        在默认展开、仅图标紧凑模式或完整布局模式之间选择
      </div>
    </div>
  )
}
