import { useNavigate } from '@tanstack/react-router'
import { getUserDisplayName, PermissionCode } from '@zen/shared'
import { Eye, LogOut, Power, Trash2, UserCheck } from 'lucide-react'

import { AgentEntityMenu } from '../../components/agent-entity-menu'
import { useSendAgentUserMessage } from '../../hooks/use-send-agent-user-message'

import type { UserListItem } from '@zen/shared'
import type { AgentEntityMenuItem } from '../../components/agent-entity-menu'

export function UserAgentMenu({
  user,
  appearance = 'row'
}: {
  user: UserListItem
  appearance?: 'card' | 'row'
}) {
  const navigate = useNavigate()
  const send = useSendAgentUserMessage()
  const name = getUserDisplayName(user)
  const suspended = user.status === 'suspended'
  const statusVerb = suspended ? '激活' : '停用'

  const items: AgentEntityMenuItem[] = [
    {
      key: 'view',
      label: '查看',
      icon: Eye,
      onSelect: () => {
        void navigate({ to: '/system/users/$userId', params: { userId: user.id } })
      }
    },
    {
      key: 'status',
      label: statusVerb,
      icon: suspended ? UserCheck : Power,
      permission: PermissionCode.USER_STATUS,
      onSelect: () => send?.(`${statusVerb}${name}用户`)
    },
    {
      key: 'revoke',
      label: '强制下线',
      icon: LogOut,
      permission: PermissionCode.USER_UPDATE,
      onSelect: () => send?.(`强制下线${name}用户`)
    },
    {
      key: 'delete',
      label: '删除',
      icon: Trash2,
      permission: PermissionCode.USER_DELETE,
      destructive: true,
      onSelect: () => send?.(`删除${name}用户`)
    }
  ]

  return (
    <AgentEntityMenu
      label={appearance === 'card' ? `打开${user.username}的操作菜单` : 'Open menu'}
      items={items}
      size="icon"
      triggerClassName={
        appearance === 'card'
          ? 'opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 [@media(hover:none)]:opacity-100'
          : 'flex h-8 w-8 p-0 data-popup-open:bg-muted'
      }
    />
  )
}
