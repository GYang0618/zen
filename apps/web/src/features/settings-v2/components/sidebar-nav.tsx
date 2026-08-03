import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  buttonVariants,
  cn,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import { useState } from 'react'

import type { ComponentType } from 'react'

export type SettingsSidebarNavItem = {
  href: string
  title: string
  icon?: ComponentType<{ className?: string }>
}

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: SettingsSidebarNavItem[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [val, setVal] = useState(pathname)

  const handleSelect = (href: string) => {
    setVal(href)
    navigate({ to: href })
  }

  return (
    <>
      <div className="p-1 md:hidden">
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className="h-12 sm:w-48">
            <SelectValue placeholder="选择设置项" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => {
              const Icon = item.icon
              return (
                <SelectItem key={item.href} value={item.href}>
                  <div className="flex gap-x-4 px-2 py-1">
                    {Icon ? <Icon className="size-4.5" /> : null}
                    <span className="text-md">{item.title}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea type="always" className="hidden w-full min-w-40 bg-background px-1 py-2 md:block">
        <nav
          className={cn('flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0', className)}
          {...props}
        >
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  pathname === item.href
                    ? 'bg-muted hover:bg-accent'
                    : 'hover:bg-accent hover:underline',
                  'justify-start'
                )}
              >
                {Icon ? <Icon className="me-2 size-4.5" /> : null}
                {item.title}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </>
  )
}
