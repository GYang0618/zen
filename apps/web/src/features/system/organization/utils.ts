import {
  formatCatalogAllowedParentTypeLabels,
  formatFromNow,
  getCatalogTypeLabel
} from '@zen/shared'

import { canOrganizationBeChildOf } from './data/data'

import type { OrganizationTypeCatalog } from '@zen/shared'
import type { Organization } from './type'

export const POSITION_LEVEL_OPTIONS = [
  { value: 'P5', label: 'P5 / 中级' },
  { value: 'P6', label: 'P6 / 资深' },
  { value: 'P7', label: 'P7 / 专家' },
  { value: 'P8', label: 'P8 / 总监' }
] as const

export function formatPositionLevel(level: string): string {
  const matched = POSITION_LEVEL_OPTIONS.find(
    (item) => item.value === level || item.label === level || level.startsWith(item.value)
  )
  return matched?.label ?? level
}

export function flattenOrganizations(nodes: Organization[]): Organization[] {
  return nodes.flatMap((node) => [node, ...flattenOrganizations(node.children ?? [])])
}

/** 收集所有含子节点的 id，用于「全部展开」 */
export function collectExpandableIds(nodes: Organization[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.children?.length ? [node.id] : []),
    ...collectExpandableIds(node.children ?? [])
  ])
}

/** 组织树默认展开的层级深度（根节点为第 1 层） */
export const DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH = 3

/** 收集默认应展开的节点 id：展开前 maxDepth 层，更深层保持折叠 */
export function collectExpandedIdsToDepth(
  nodes: Organization[],
  maxDepth: number,
  currentDepth = 1
): string[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length || currentDepth >= maxDepth) return []
    return [node.id, ...collectExpandedIdsToDepth(node.children, maxDepth, currentDepth + 1)]
  })
}

/** 从树中剔除指定节点及其整棵子树 */
export function pruneOrganizationTree(
  nodes: Organization[],
  excludeIds: ReadonlySet<string>
): Organization[] {
  return nodes.flatMap((node) => {
    if (excludeIds.has(node.id)) return []
    return [
      {
        ...node,
        children: node.children ? pruneOrganizationTree(node.children, excludeIds) : node.children
      }
    ]
  })
}

/** 按名称过滤组织树，保留匹配节点及其祖先路径 */
export function filterOrganizationTreeByName(
  nodes: Organization[],
  keyword: string
): Organization[] {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return nodes

  const filterNode = (node: Organization): Organization | null => {
    const children = (node.children ?? [])
      .map(filterNode)
      .filter((child): child is Organization => child !== null)
    const selfMatch = node.name.toLowerCase().includes(normalized)
    if (!selfMatch && children.length === 0) return null
    return { ...node, children }
  }

  return nodes.map(filterNode).filter((node): node is Organization => node !== null)
}

export function findOrganization(nodes: Organization[], id: string): Organization | undefined {
  return flattenOrganizations(nodes).find((node) => node.id === id)
}

/** 收集目标节点的全部祖先 id（近父在前） */
export function collectAncestorIds(nodes: Organization[], id: string): string[] {
  const ids: string[] = []
  let current = findOrganization(nodes, id)

  while (current?.parentId) {
    ids.push(current.parentId)
    current = findOrganization(nodes, current.parentId)
  }

  return ids
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
export function isOrganizationDescendant(
  nodes: Organization[],
  ancestorId: string,
  candidateId: string
): boolean {
  if (ancestorId === candidateId) return true
  const ancestor = findOrganization(nodes, ancestorId)
  if (!ancestor?.children?.length) return false
  return flattenOrganizations(ancestor.children).some((node) => node.id === candidateId)
}

/** 将节点移动到新的父节点下（追加为最后一个子节点） */
export function moveOrganizationToParent(
  nodes: Organization[],
  nodeId: string,
  newParentId: string
): Organization[] | null {
  if (isOrganizationDescendant(nodes, nodeId, newParentId)) return null

  const { tree, removed } = removeOrganizationFromTree(nodes, nodeId)
  if (!removed) return null

  const updated: Organization = { ...removed, parentId: newParentId }
  return insertOrganizationChild(tree, newParentId, updated)
}

export type OrganizationDropAction = 'reparent-as-child'

export type OrganizationDropRejectionReason =
  | 'same-organization'
  | 'same-parent'
  | 'source-not-found'
  | 'target-not-found'
  | 'own-descendant'
  | 'incompatible-hierarchy'

export type OrganizationDropValidation =
  | {
      isValid: true
      action: OrganizationDropAction
      destinationParentId: string
    }
  | {
      isValid: false
      reason: OrganizationDropRejectionReason
    }

/**
 * 校验拖拽落点：仅支持把来源节点挂到目标节点下成为其子节点。
 */
export function validateOrganizationDrop(
  nodes: Organization[],
  activeId: string,
  overId: string
): OrganizationDropValidation {
  if (activeId === overId) {
    return { isValid: false, reason: 'same-organization' }
  }

  const activeNode = findOrganization(nodes, activeId)
  if (!activeNode) {
    return { isValid: false, reason: 'source-not-found' }
  }

  if (isOrganizationDescendant(nodes, activeId, overId)) {
    return { isValid: false, reason: 'own-descendant' }
  }

  const overNode = findOrganization(nodes, overId)
  if (!overNode) {
    return { isValid: false, reason: 'target-not-found' }
  }

  if ((activeNode.parentId ?? null) === overNode.id) {
    return { isValid: false, reason: 'same-parent' }
  }

  if (!canOrganizationBeChildOf(activeNode.type, overNode.type)) {
    return { isValid: false, reason: 'incompatible-hierarchy' }
  }

  return {
    isValid: true,
    action: 'reparent-as-child',
    destinationParentId: overNode.id
  }
}

/** 校验拖拽是否满足组织层级关系 */
export function canMoveOrganizationInTree(
  nodes: Organization[],
  activeId: string,
  overId: string
): boolean {
  return validateOrganizationDrop(nodes, activeId, overId).isValid
}

/** 将无效拖拽原因转换为面向用户的反馈文案 */
export function getOrganizationDropRejectionMessage(
  nodes: Organization[],
  activeId: string,
  overId: string,
  reason: OrganizationDropRejectionReason,
  catalog?: OrganizationTypeCatalog | null
): string {
  const activeNode = findOrganization(nodes, activeId)
  const overNode = findOrganization(nodes, overId)
  const activeLabel = activeNode ? getCatalogTypeLabel(activeNode.type, catalog) : '该组织'
  const targetLabel = overNode ? getCatalogTypeLabel(overNode.type, catalog) : '该组织'

  switch (reason) {
    case 'own-descendant':
      return `${activeLabel}不能拖拽到自身或其下级组织中`
    case 'incompatible-hierarchy': {
      const allowedParents = activeNode
        ? formatCatalogAllowedParentTypeLabels(activeNode.type, catalog)
        : ''
      return allowedParents
        ? `${activeLabel}不能作为${targetLabel}的下级组织，请拖拽到${allowedParents}下`
        : `${activeLabel}不允许移动到${targetLabel}下`
    }
    case 'same-organization':
      return '不能拖拽到当前组织自身'
    case 'same-parent':
      return '已在该组织下'
    case 'source-not-found':
    case 'target-not-found':
      return '目标组织不存在，请重试'
  }
}

/** 拖拽落点处理：仅将源节点移动到目标节点下 */
export function moveOrganizationInTree(
  nodes: Organization[],
  activeId: string,
  overId: string
): Organization[] | null {
  const validation = validateOrganizationDrop(nodes, activeId, overId)
  if (!validation.isValid) return null
  return moveOrganizationToParent(nodes, activeId, validation.destinationParentId)
}

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
  return formatFromNow(value)
}
