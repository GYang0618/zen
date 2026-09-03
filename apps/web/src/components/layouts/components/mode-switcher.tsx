import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@zen/ui'
import { Bot, ChevronsUpDown, LayoutDashboard } from 'lucide-react'

import { useSwitchShellMode } from '@/hooks'

const MODE_OPTIONS = [
  {
    id: 'agent' as const,
    name: '智能体',
    description: '对话驱动任务',
    icon: Bot
  },
  {
    id: 'admin' as const,
    name: '管理后台',
    description: '菜单与页面操作',
    icon: LayoutDashboard
  }
] as const

export function ModeSwitcher() {
  const { isMobile } = useSidebar()
  const { mode, switchMode } = useSwitchShellMode()

  const active = MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[1]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={active.name}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <active.icon className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{active.name}</span>
                <span className="truncate text-xs">{active.description}</span>
              </div>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">工作模式</DropdownMenuLabel>
            {MODE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => switchMode(option.id)}
                className="gap-2 p-2"
                data-active={option.id === mode || undefined}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <option.icon className="size-4 shrink-0" />
                </div>
                <div className="grid flex-1 leading-tight">
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
