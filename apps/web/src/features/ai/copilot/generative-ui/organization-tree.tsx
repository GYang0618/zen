import { useRenderTool } from '@copilotkit/react-core/v2'
import { organizationTreeSchema } from '@zen/shared'
import z from 'zod'

import { AITree } from '@/components/ai'

import type { AITreeNode } from '@/components/ai'
import type { OrganizationTreeNode } from '@zen/shared'

const ORG_TYPE_LABEL: Record<OrganizationTreeNode['type'], string> = {
  company: '公司',
  branch: '分支',
  department: '部门',
  team: '小组'
}

function toTreeNodes(nodes: OrganizationTreeNode[]): AITreeNode[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.name,
    description: node.code,
    badge: `${ORG_TYPE_LABEL[node.type]} · ${node.memberCount}人`,
    children: toTreeNodes(node.children)
  }))
}

function parseOrganizationTreeResult(result: string) {
  try {
    const parsed = organizationTreeSchema.safeParse(JSON.parse(result) as unknown)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export function useOrganizationTreeView() {
  useRenderTool(
    {
      name: 'query_organization_tree',
      parameters: z.object({}),
      render: ({ result }) => {
        const tree = parseOrganizationTreeResult(result ?? '')
        return <AITree nodes={toTreeNodes(tree ?? [])} emptyMessage="暂无组织节点" />
      }
    },
    []
  )
}
