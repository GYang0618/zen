import { useRenderTool } from '@copilotkit/react-core/v2'
import {
  organizationPageSchema,
  organizationsQueryToolSchema,
  organizationTreeQueryToolSchema,
  organizationTreeSchema
} from '@zen/shared'

import { parseToolResult } from '../../lib/parse-tool-result'
import { OrganizationsList } from './organizations-list'

import type { Organization as SharedOrganization } from '@zen/shared'
import type { Organization } from '@/features/system/organization/type'

function buildTreeFromItems(items: SharedOrganization[]): Organization[] {
  const map = new Map<string, Organization>()
  const roots: Organization[] = []
  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }
  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
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
          const keyword = (parameters as { keyword?: string })?.keyword
          return (
            <OrganizationsList
              title={meta?.title ?? '组织架构查询结果'}
              description={meta?.description}
              treeData={data ?? []}
              keyword={keyword}
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
          const keyword = (parameters as { keyword?: string })?.keyword
          const treeData = data?.items ? buildTreeFromItems(data.items) : undefined
          return (
            <OrganizationsList
              title={meta?.title ?? '组织架构查询结果'}
              description={meta?.description}
              treeData={treeData}
              keyword={keyword}
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
