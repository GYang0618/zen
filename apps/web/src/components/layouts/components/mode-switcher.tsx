import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@zen/ui'
import { ChevronsUpDown } from 'lucide-react'

import { useSwitchShellMode } from '@/hooks'
import { SHELL_MODES } from '@/stores'

import { SHELL_MODE_META } from '../shell-mode-meta'

const MODE_OPTIONS = SHELL_MODES.map((id) => ({ id, ...SHELL_MODE_META[id] }))

export function ModeSwitcher() {
  const { isMobile } = useSidebar()
  const { mode, switchMode } = useSwitchShellMode()

  const active = SHELL_MODE_META[mode]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <active.icon className="size-4" />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{active.name}</span>
              <span className="truncate text-xs">{active.description}</span>
            </div>
            <ChevronsUpDown className="ms-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                工作模式
              </DropdownMenuLabel>
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
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
