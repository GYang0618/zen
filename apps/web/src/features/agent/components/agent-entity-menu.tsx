import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@zen/ui'
import { MoreHorizontal } from 'lucide-react'

import { canAccess } from '@/lib/auth/permissions'

import type { LucideIcon } from 'lucide-react'

export interface AgentEntityMenuItem {
  key: string
  label: string
  icon: LucideIcon
  onSelect: () => void
  permission?: string
  destructive?: boolean
}

interface AgentEntityMenuProps {
  label: string
  items: AgentEntityMenuItem[]
  /** 图谱节点上的菜单需要拦住指针事件，避免触发布局画布的选中。 */
  isolatePointer?: boolean
  size?: 'icon' | 'icon-sm' | 'icon-xs'
  triggerClassName?: string
}

function renderItem(item: AgentEntityMenuItem) {
  const Icon = item.icon
  return (
    <DropdownMenuItem
      key={item.key}
      variant={item.destructive ? 'destructive' : 'default'}
      onClick={item.onSelect}
    >
      <Icon />
      {item.label}
    </DropdownMenuItem>
  )
}

export function AgentEntityMenu({
  label,
  items,
  isolatePointer = false,
  size = 'icon-sm',
  triggerClassName
}: AgentEntityMenuProps) {
  const visible = items.filter(
    (item) => item.permission === undefined || canAccess([item.permission])
  )
  if (visible.length === 0) return null

  const regular = visible.filter((item) => !item.destructive)
  const destructive = visible.filter((item) => item.destructive)
  const stopPointer = isolatePointer
    ? (event: { stopPropagation: () => void }) => {
        event.stopPropagation()
      }
    : undefined

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size={size}
            aria-label={label}
            className={cn(triggerClassName)}
            onClick={stopPointer}
            onMouseDown={stopPointer}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {regular.map((item) => renderItem(item))}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((item) => renderItem(item))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
