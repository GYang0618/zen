import { Link } from '@tanstack/react-router'
import { buttonVariants, cn } from '@zen/ui'
import { Bell, KeyRound, Palette, ShieldAlert, User } from 'lucide-react'

import type { ComponentType } from 'react'

type NavItem = {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const sidebarNavItems: NavItem[] = [
  {
    title: '个人资料',
    href: '/settings/profile',
    icon: User
  },
  {
    title: '账号与安全',
    href: '/settings/account',
    icon: KeyRound
  },
  {
    title: '外观偏好',
    href: '/settings/appearance',
    icon: Palette
  },
  {
    title: '通知提醒',
    href: '/settings/notifications',
    icon: Bell
  },
  {
    title: '安全动态',
    href: '/settings/activity',
    icon: ShieldAlert
  }
]

type SidebarNavProps = {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  return (
    <nav className={cn('flex space-x-2 overflow-x-auto lg:flex-col lg:space-x-0 lg:space-y-1', className)}>
      {sidebarNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'justify-start gap-2 whitespace-nowrap text-muted-foreground hover:text-foreground'
            )}
            activeProps={{
              className: 'bg-muted font-medium text-foreground hover:bg-muted'
            }}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
