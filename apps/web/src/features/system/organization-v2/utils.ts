import {
  canOrganizationBeChildOf,
  formatAllowedParentTypeLabels,
  getOrganizationTypeLabel
} from './data/data'

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

function reorderChildren(
  children: Organization[],
  activeId: string,
  overId: string
): Organization[] {
  const oldIndex = children.findIndex((child) => child.id === activeId)
  const newIndex = children.findIndex((child) => child.id === overId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return children
  const next = [...children]
  const [moved] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, moved)
  return next
}

/**
 * 在同一父节点下调整兄弟节点顺序。
 * parentId 为空时表示调整顶层根组织（如多个集团）之间的顺序，直接对传入的顶层数组重排。
 */
export function reorderOrganizationSiblings(
  nodes: Organization[],
  parentId: string | undefined,
  activeId: string,
  overId: string
): Organization[] {
  if (!parentId) {
    return reorderChildren(nodes, activeId, overId)
  }

  const walk = (list: Organization[]): Organization[] =>
    list.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: reorderChildren(node.children ?? [], activeId, overId) }
      }
      if (!node.children?.length) return node
      return { ...node, children: walk(node.children) }
    })

  return walk(nodes)
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

function normalizeOrgType(type: string): string {
  return type.toUpperCase()
}

function isSameOrganizationType(left: string, right: string): boolean {
  return normalizeOrgType(left) === normalizeOrgType(right)
}

export type OrganizationDropAction =
  | 'reorder-siblings'
  | 'reparent-as-child'
  | 'reparent-as-sibling'

export type OrganizationDropRejectionReason =
  | 'same-organization'
  | 'source-not-found'
  | 'target-not-found'
  | 'own-descendant'
  | 'incompatible-hierarchy'

export type OrganizationDropValidation =
  | {
      isValid: true
      action: OrganizationDropAction
      /** 顶层根组织之间重排时没有父节点，此时为 undefined */
      destinationParentId: string | undefined
    }
  | {
      isValid: false
      reason: OrganizationDropRejectionReason
    }

/** 解析拖拽落点：同类型视为挂到目标父节点下成为兄弟节点 */
function resolveOrganizationDropAction(
  nodes: Organization[],
  activeNode: Organization,
  overNode: Organization
): OrganizationDropAction | null {
  if (activeNode.parentId === overNode.parentId) return 'reorder-siblings'

  if (isSameOrganizationType(activeNode.type, overNode.type) && overNode.parentId) {
    const parent = findOrganization(nodes, overNode.parentId)
    if (parent && canOrganizationBeChildOf(activeNode.type, parent.type)) {
      return 'reparent-as-sibling'
    }
    return null
  }

  if (canOrganizationBeChildOf(activeNode.type, overNode.type)) {
    return 'reparent-as-child'
  }

  return null
}

/**
 * 校验拖拽落点，并返回明确的移动方式或拒绝原因。
 * 所有拖拽预览和提交应基于同一个初始树快照调用，避免预览状态影响最终校验。
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

  const action = resolveOrganizationDropAction(nodes, activeNode, overNode)
  if (!action) {
    return { isValid: false, reason: 'incompatible-hierarchy' }
  }

  const destinationParentId =
    action === 'reparent-as-child'
      ? overNode.id
      : action === 'reparent-as-sibling'
        ? overNode.parentId
        : activeNode.parentId

  return { isValid: true, action, destinationParentId }
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
  reason: OrganizationDropRejectionReason
): string {
  const activeNode = findOrganization(nodes, activeId)
  const overNode = findOrganization(nodes, overId)
  const activeLabel = activeNode ? getOrganizationTypeLabel(activeNode.type) : '该组织'
  const targetLabel = overNode ? getOrganizationTypeLabel(overNode.type) : '该组织'

  switch (reason) {
    case 'own-descendant':
      return `${activeLabel}不能拖拽到自身或其下级组织中`
    case 'incompatible-hierarchy': {
      const allowedParents = activeNode ? formatAllowedParentTypeLabels(activeNode.type) : ''
      return allowedParents
        ? `${activeLabel}不能作为${targetLabel}的下级组织，请拖拽到${allowedParents}下`
        : `${activeLabel}不允许移动到${targetLabel}下`
    }
    case 'same-organization':
      return '不能拖拽到当前组织自身'
    case 'source-not-found':
    case 'target-not-found':
      return '目标组织不存在，请重试'
  }
}

/**
 * 拖拽落点处理：同父级重排；同类型挂到目标父节点下成为兄弟；否则作为目标子节点
 */
export function moveOrganizationInTree(
  nodes: Organization[],
  activeId: string,
  overId: string
): Organization[] | null {
  const validation = validateOrganizationDrop(nodes, activeId, overId)
  if (!validation.isValid) return null

  const activeNode = findOrganization(nodes, activeId)
  if (!activeNode) return null

  const overNode = findOrganization(nodes, overId)
  if (!overNode) return null

  switch (validation.action) {
    case 'reorder-siblings':
      return reorderOrganizationSiblings(nodes, activeNode.parentId, activeId, overId)
    case 'reparent-as-sibling': {
      if (!overNode.parentId) return null
      const parentId = overNode.parentId
      const tree =
        activeNode.parentId === parentId
          ? nodes
          : moveOrganizationToParent(nodes, activeId, parentId)
      if (!tree) return null
      return reorderOrganizationSiblings(tree, parentId, activeId, overId)
    }
    case 'reparent-as-child':
      return moveOrganizationToParent(nodes, activeId, overId)
    default:
      return null
  }
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
