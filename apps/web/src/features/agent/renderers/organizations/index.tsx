import { useRenderTool } from '@copilotkit/react-core/v2'
import {
  organizationPageSchema,
  organizationsQueryToolSchema,
  organizationTreeQueryToolSchema,
  organizationTreeSchema
} from '@zen/shared'

import { parseToolResult } from '../../lib/parse-tool-result'
import { OrganizationsList } from './organizations-list'

import type { Organization, OrganizationTreeNode } from '@zen/shared'

function buildTreeFromItems(items: Organization[]): OrganizationTreeNode[] {
  const map = new Map<string, OrganizationTreeNode>()
  const roots: OrganizationTreeNode[] = []
  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }
  for (const item of items) {
    const node = map.get(item.id)
    if (!node) continue
    const parent = item.parentId ? map.get(item.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

export function useOrganizationsRenderers() {
  useRenderTool({
    name: 'query_organization_tree',
    parameters: organizationTreeQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress')
          return <span className="shimmer">正在准备组织架构查询参数...</span>
        const meta = (
          parameters as { meta?: { title?: string; description?: string; display?: boolean } }
        )?.meta
        if (meta?.display === false) return null

        if (status === 'executing') return <span className="shimmer">正在查询组织架构...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, organizationTreeSchema)
          return (
            <OrganizationsList
              title={meta?.title ?? '组织架构查询结果'}
              description={meta?.description}
              treeData={data ?? []}
            />
          )
        }
        return null
      } catch (error) {
        console.error(error)
        return null
      }
    }
  })

  useRenderTool({
    name: 'query_organizations_list',
    parameters: organizationsQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress') return <span className="shimmer">正在准备组织查询参数...</span>
        const meta = (
          parameters as { meta?: { title?: string; description?: string; display?: boolean } }
        )?.meta
        if (meta?.display === false) return null

        if (status === 'executing') return <span className="shimmer">正在查询组织数据...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, organizationPageSchema)
          const treeData = data?.items ? buildTreeFromItems(data.items) : undefined
          return (
            <OrganizationsList
              title={meta?.title ?? '组织架构查询结果'}
              description={meta?.description}
              treeData={treeData}
            />
          )
        }
        return null
      } catch (error) {
        console.error(error)
        return null
      }
    }
  })
}
