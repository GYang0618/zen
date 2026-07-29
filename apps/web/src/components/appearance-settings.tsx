import { Button, cn, useSidebar } from '@zen/ui'
import { CircleCheck, RotateCcw } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'

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
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'

import type { ReactElement, SVGProps } from 'react'
import type { Collapsible } from '@/context/layout-provider'

const { Item, Root: Radio } = RadioGroupPrimitive

type AppearanceSize = 'sm' | 'lg'

export function SectionTitle({
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
      {showReset && onReset ? (
        <Button size="icon" variant="secondary" className="size-4 rounded-full" onClick={onReset}>
          <RotateCcw className="size-3" />
        </Button>
      ) : null}
    </div>
  )
}

export function RadioGroupItem({
  item,
  isTheme = false,
  size = 'sm'
}: {
  item: {
    value: string
    label: string
    icon: (props: SVGProps<SVGSVGElement>) => ReactElement
  }
  isTheme?: boolean
  size?: AppearanceSize
}) {
  const isLarge = size === 'lg'

  return (
    <Item
      value={item.value}
      className={cn('group outline-none', 'transition duration-200 ease-in')}
      aria-label={`选择${item.label}`}
      aria-describedby={`${item.value}-description`}
    >
      <div
        className={cn(
          'relative',
          isLarge
            ? cn(
                'rounded-lg border border-border bg-card p-2 transition-all',
                'group-data-[state=checked]:border-primary group-data-[state=checked]:ring-1 group-data-[state=checked]:ring-primary',
                'group-focus-visible:ring-2 group-focus-visible:ring-ring'
              )
            : cn(
                'rounded-[6px] ring-[1px] ring-border',
                'group-data-[state=checked]:shadow-2xl group-data-[state=checked]:ring-primary',
                'group-focus-visible:ring-2'
              )
        )}
        role="img"
        aria-hidden="false"
        aria-label={`${item.label}选项预览`}
      >
        <CircleCheck
          className={cn(
            'fill-primary stroke-white',
            isLarge ? 'size-5' : 'size-6',
            'group-data-[state=unchecked]:hidden',
            'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2'
          )}
          aria-hidden="true"
        />
        <item.icon
          className={cn(
            isLarge && 'h-auto w-full',
            !isTheme &&
              'fill-primary stroke-primary group-data-[state=unchecked]:fill-muted-foreground group-data-[state=unchecked]:stroke-muted-foreground'
          )}
          aria-hidden="true"
        />
      </div>
      <div
        className={cn('mt-1.5 text-center', isLarge ? 'text-sm' : 'text-xs')}
        id={`${item.value}-description`}
        aria-live="polite"
      >
        {item.label}
      </div>
    </Item>
  )
}

function configRadioClassName(size: AppearanceSize) {
  return cn(
    'grid w-full grid-cols-3 gap-4',
    size === 'sm' && 'max-w-md',
    size === 'lg' && 'max-w-xl'
  )
}

type ConfigProps = {
  size?: AppearanceSize
}

/** ConfigDrawer 默认紧凑；外观设置页传 size="lg" */
export function ThemeConfig({ size = 'sm' }: ConfigProps) {
  const { defaultTheme, theme, setTheme } = useTheme()
  return (
    <div className="space-y-3">
      <SectionTitle
        title="视觉主题模式"
        showReset={theme !== defaultTheme}
        onReset={() => setTheme(defaultTheme)}
        className={size === 'lg' ? 'mb-0 text-foreground' : undefined}
      />
      <Radio
        value={theme}
        onValueChange={setTheme}
        className={configRadioClassName(size)}
        aria-label="选择主题偏好"
      >
        {[
          { value: 'light', label: '亮色', icon: IconThemeLight },
          { value: 'dark', label: '暗色', icon: IconThemeDark },
          { value: 'system', label: '跟随系统', icon: IconThemeSystem }
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} isTheme size={size} />
        ))}
      </Radio>
    </div>
  )
}

export function SidebarConfig({ size = 'sm' }: ConfigProps) {
  const { defaultVariant, variant, setVariant } = useLayout()
  return (
    <div className={cn('space-y-3', 'max-md:hidden')}>
      <SectionTitle
        title="侧边栏形态"
        showReset={defaultVariant !== variant}
        onReset={() => setVariant(defaultVariant)}
        className={size === 'lg' ? 'mb-0 text-foreground' : undefined}
      />
      <Radio
        value={variant}
        onValueChange={setVariant}
        className={configRadioClassName(size)}
        aria-label="选择侧边栏样式"
      >
        {[
          { value: 'inset', label: '内嵌', icon: IconSidebarInset },
          { value: 'floating', label: '悬浮', icon: IconSidebarFloating },
          { value: 'sidebar', label: '经典', icon: IconSidebarSidebar }
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} size={size} />
        ))}
      </Radio>
    </div>
  )
}

export function LayoutConfig({ size = 'sm' }: ConfigProps) {
  const { open, setOpen } = useSidebar()
  const { defaultCollapsible, collapsible, setCollapsible } = useLayout()
  const radioState = open ? 'default' : collapsible

  return (
    <div className={cn('space-y-3', 'max-md:hidden')}>
      <SectionTitle
        title="布局模式"
        showReset={radioState !== 'default'}
        onReset={() => {
          setOpen(true)
          setCollapsible(defaultCollapsible)
        }}
        className={size === 'lg' ? 'mb-0 text-foreground' : undefined}
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
        className={configRadioClassName(size)}
        aria-label="选择布局样式"
      >
        {[
          { value: 'default', label: '默认', icon: IconLayoutDefault },
          { value: 'icon', label: '紧凑', icon: IconLayoutCompact },
          { value: 'offcanvas', label: '完整布局', icon: IconLayoutFull }
        ].map((item) => (
          <RadioGroupItem key={item.value} item={item} size={size} />
        ))}
      </Radio>
    </div>
  )
}
