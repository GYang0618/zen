import type { OrganizationTreeNode } from '@zen/shared'

export const POST_GRADE_OPTIONS = [
  { value: 'P5', label: 'P5 / 中级' },
  { value: 'P6', label: 'P6 / 资深' },
  { value: 'P7', label: 'P7 / 专家' },
  { value: 'P8', label: 'P8 / 总监' }
] as const

export function formatPostGrade(grade: string | null): string {
  if (!grade) return '—'
  const matched = POST_GRADE_OPTIONS.find(
    (item) => item.value === grade || item.label === grade || grade.startsWith(item.value)
  )
  return matched?.label ?? grade
}

export function slugifyPostCode(name: string): string {
  const ascii = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)

  if (ascii.length >= 2 && /^[a-z]/.test(ascii)) {
    return ascii
  }

  return `post_${Date.now().toString(36)}`
}

export function flattenOrganizationTree(
  nodes: OrganizationTreeNode[],
  acc: OrganizationTreeNode[] = []
): OrganizationTreeNode[] {
  for (const node of nodes) {
    acc.push(node)
    flattenOrganizationTree(node.children, acc)
  }
  return acc
}

export function findOrganizationNode(
  nodes: OrganizationTreeNode[],
  id: string
): OrganizationTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findOrganizationNode(node.children, id)
    if (found) return found
  }
  return null
}

export function findOrganizationPath(
  nodes: OrganizationTreeNode[],
  id: string,
  trail: OrganizationTreeNode[] = []
): OrganizationTreeNode[] | null {
  for (const node of nodes) {
    const next = [...trail, node]
    if (node.id === id) return next
    const found = findOrganizationPath(node.children, id, next)
    if (found) return found
  }
  return null
}

/** Collect self + all descendant ids (for parent-select exclusion). */
export function collectDescendantIds(node: OrganizationTreeNode): Set<string> {
  const ids = new Set<string>([node.id])
  const walk = (current: OrganizationTreeNode) => {
    for (const child of current.children) {
      ids.add(child.id)
      walk(child)
    }
  }
  walk(node)
  return ids
}

export function collectExpandableIds(nodes: OrganizationTreeNode[]): string[] {
  const ids: string[] = []
  const walk = (list: OrganizationTreeNode[]) => {
    for (const node of list) {
      if (node.children.length > 0) {
        ids.push(node.id)
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return ids
}

/** 按名称 / 编码过滤组织树，保留匹配节点及其祖先路径 */
export function filterOrganizationTree(
  nodes: OrganizationTreeNode[],
  keyword: string
): OrganizationTreeNode[] {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return nodes

  const filterNode = (node: OrganizationTreeNode): OrganizationTreeNode | null => {
    const children = node.children
      .map(filterNode)
      .filter((child): child is OrganizationTreeNode => child !== null)
    const selfMatch =
      node.name.toLowerCase().includes(normalized) || node.code.toLowerCase().includes(normalized)
    if (!selfMatch && children.length === 0) return null
    return { ...node, children }
  }

  return nodes.map(filterNode).filter((node): node is OrganizationTreeNode => node !== null)
}

export function postInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '岗'
  const ascii = trimmed.match(/[A-Za-z]+/g)?.join('') ?? ''
  if (ascii.length >= 2) return ascii.slice(0, 2).toUpperCase()
  return trimmed.slice(0, 1)
}
