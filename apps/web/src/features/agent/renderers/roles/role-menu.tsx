import { PermissionCode } from '@zen/shared'
import { Ban, ShieldCheck, Trash } from 'lucide-react'

import { AgentEntityMenu } from '../../components/agent-entity-menu'
import { useSendAgentUserMessage } from '../../hooks/use-send-agent-user-message'

import type { RoleListItem } from '@zen/shared'
import type { AgentEntityMenuItem } from '../../components/agent-entity-menu'

function isProtectedRole(role: Pick<RoleListItem, 'isSystem' | 'kind'>) {
  return role.isSystem || role.kind === 'system'
}

export function RoleAgentMenu({ role }: { role: RoleListItem }) {
  const send = useSendAgentUserMessage()
  if (isProtectedRole(role)) return null

  const frozen = role.status === 'disabled'
  const statusVerb = frozen ? '激活' : '冻结'
  const items: AgentEntityMenuItem[] = [
    {
      key: 'status',
      label: frozen ? '激活角色' : '冻结角色',
      icon: frozen ? ShieldCheck : Ban,
      permission: PermissionCode.ROLE_UPDATE,
      onSelect: () => send?.(`${statusVerb}${role.name}角色`)
    },
    {
      key: 'delete',
      label: '删除角色',
      icon: Trash,
      permission: PermissionCode.ROLE_DELETE,
      destructive: true,
      onSelect: () => send?.(`删除${role.name}角色`)
    }
  ]

  return <AgentEntityMenu label={`${role.name} 更多操作`} items={items} size="icon" />
}
