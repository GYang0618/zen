import { PermissionCode } from '@zen/shared'
import { Ban, Power, Trash2 } from 'lucide-react'

import { AgentEntityMenu } from '../../components/agent-entity-menu'
import { useSendAgentUserMessage } from '../../hooks/use-send-agent-user-message'

import type { JobProfileListItem } from '@zen/shared'
import type { AgentEntityMenuItem } from '../../components/agent-entity-menu'

export function PostAgentMenu({ item }: { item: JobProfileListItem }) {
  const send = useSendAgentUserMessage()
  const active = item.status === 'active'
  const statusVerb = active ? '停用' : '启用'
  const items: AgentEntityMenuItem[] = [
    {
      key: 'status',
      label: statusVerb,
      icon: active ? Ban : Power,
      permission: PermissionCode.POST_MANAGE,
      destructive: active,
      onSelect: () => send?.(`${statusVerb}${item.name}岗位`)
    },
    {
      key: 'delete',
      label: '删除',
      icon: Trash2,
      permission: PermissionCode.POST_MANAGE,
      destructive: true,
      onSelect: () => send?.(`删除${item.name}岗位`)
    }
  ]

  return <AgentEntityMenu label={`打开${item.name}的操作`} items={items} size="icon-sm" />
}
