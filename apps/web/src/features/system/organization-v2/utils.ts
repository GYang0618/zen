import type { Organization } from './type'

export function flattenOrganizations(nodes: Organization[]): Organization[] {
  return nodes.flatMap((node) => [node, ...flattenOrganizations(node.children ?? [])])
}

export function findOrganization(
  nodes: Organization[],
  id: string
): Organization | undefined {
  return flattenOrganizations(nodes).find((node) => node.id === id)
}

export function mapOrganizationTree(
  nodes: Organization[],
  mapper: (node: Organization) => Organization
): Organization[] {
  return nodes.map((node) => {
    const next = mapper(node)
    return {
      ...next,
      children: next.children ? mapOrganizationTree(next.children, mapper) : next.children
    }
  })
}

export function updateOrganizationInTree(
  nodes: Organization[],
  id: string,
  updater: (node: Organization) => Organization
): Organization[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node)
    }
    if (!node.children?.length) return node
    return {
      ...node,
      children: updateOrganizationInTree(node.children, id, updater)
    }
  })
}

export function insertOrganizationChild(
  nodes: Organization[],
  parentId: string,
  child: Organization
): Organization[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children ?? []), child],
        memberCount: node.memberCount + child.memberCount,
        positionCount: node.positionCount + child.positionCount
      }
    }
    if (!node.children?.length) return node
    return {
      ...node,
      children: insertOrganizationChild(node.children, parentId, child)
    }
  })
}

/** 从树中移除节点（不递归计入祖先计数，调用方自行处理或仅用于本地 mock） */
export function removeOrganizationFromTree(
  nodes: Organization[],
  id: string
): { tree: Organization[]; removed?: Organization } {
  let removed: Organization | undefined

  const walk = (list: Organization[]): Organization[] =>
    list.flatMap((node) => {
      if (node.id === id) {
        removed = node
        return []
      }
      if (!node.children?.length) return [node]
      return [
        {
          ...node,
          children: walk(node.children)
        }
      ]
    })

  return { tree: walk(nodes), removed }
}

export function formatEffectiveDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function formatBudget(value: number): string {
  return `${value.toLocaleString('zh-CN')}¥`
}
