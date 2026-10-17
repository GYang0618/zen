import { Link, useNavigate } from '@tanstack/react-router'
import { getOrganizationTypeLabel, PermissionCode } from '@zen/shared'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Settings, Trash2 } from 'lucide-react'

import { Can } from '@/components/auth/can'

import { AgentEntityMenu } from '../../components/agent-entity-menu'
import { useSendAgentUserMessage } from '../../hooks/use-send-agent-user-message'

import type { OrganizationTreeNode } from '@zen/shared'
import type { AgentEntityMenuItem } from '../../components/agent-entity-menu'

export function OrganizationAgentMenu({
  organization,
  isolatePointer = false
}: {
  organization: OrganizationTreeNode
  isolatePointer?: boolean
}) {
  const navigate = useNavigate()
  const send = useSendAgentUserMessage()
  const typeLabel = getOrganizationTypeLabel(organization.type)
  const items: AgentEntityMenuItem[] = [
    {
      key: 'config',
      label: '配置',
      icon: Settings,
      onSelect: () => {
        void navigate({ to: '/system/organization/$id', params: { id: organization.id } })
      }
    },
    {
      key: 'delete',
      label: '删除',
      icon: Trash2,
      permission: PermissionCode.ORG_DELETE,
      destructive: true,
      onSelect: () => send?.(`删除${organization.name}${typeLabel}`)
    }
  ]

  return (
    <AgentEntityMenu
      label={`${organization.name}更多操作`}
      items={items}
      isolatePointer={isolatePointer}
      size="icon-xs"
      triggerClassName="nodrag nopan absolute top-2 right-2 pointer-events-none opacity-0 transition-opacity duration-200 group-hover/org-node:pointer-events-auto group-hover/org-node:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100"
    />
  )
}

export function OrganizationAgentTreeActions({
  organization
}: {
  organization: OrganizationTreeNode
}) {
  const send = useSendAgentUserMessage()
  const typeLabel = getOrganizationTypeLabel(organization.type)

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="配置"
              className="pointer-events-none opacity-0 transition-opacity duration-200 group-hover/item:pointer-events-auto group-hover/item:opacity-100"
              nativeButton={false}
              render={
                <Link
                  to="/system/organization/$id"
                  params={{ id: organization.id }}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            />
          }
        >
          <Settings />
        </TooltipTrigger>
        <TooltipContent>配置</TooltipContent>
      </Tooltip>
      <Can permission={PermissionCode.ORG_DELETE}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`删除${organization.name}`}
                className="pointer-events-none text-destructive opacity-0 transition-opacity duration-200 hover:text-destructive group-hover/item:pointer-events-auto group-hover/item:opacity-100"
                onClick={(event) => {
                  event.stopPropagation()
                  send?.(`删除${organization.name}${typeLabel}`)
                }}
              >
                <Trash2 data-icon="inline-start" />
              </Button>
            }
          />
          <TooltipContent>删除 / 解散组织</TooltipContent>
        </Tooltip>
      </Can>
    </>
  )
}
