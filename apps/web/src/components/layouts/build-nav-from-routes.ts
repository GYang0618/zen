import { hasAnyPermission } from '@zen/shared'

import type { AppPath, RouterMeta } from '@/types/router'
import type { NavCollapsible, NavGroup, NavItem, NavLink } from './types'

const DEFAULT_ORDER = 100

export type RouteTreeNode = {
  id?: string
  fullPath: string
  options?: { staticData?: RouterMeta }
  children?: readonly RouteTreeNode[]
}

type NavEntry = {
  order: number
  item: NavItem
}

type GroupBucket = {
  slug: string
  title: string
  order: number
  entries: NavEntry[]
}

function getMeta(node: RouteTreeNode): RouterMeta | undefined {
  return node.options?.staticData
}

function getChildren(node: RouteTreeNode): readonly RouteTreeNode[] {
  const kids = node.children
  if (!kids) return []
  if (Array.isArray(kids)) return kids
  return Object.values(kids as unknown as Record<string, RouteTreeNode>)
}

function isErrorPath(fullPath: string): boolean {
  return fullPath.includes('/errors/')
}

function passesGate(
  meta: RouterMeta | undefined,
  permissions: readonly string[],
  activePluginIds?: readonly string[],
  unrestricted = false
): boolean {
  if (!unrestricted && meta?.permissions && !hasAnyPermission(permissions, meta.permissions)) {
    return false
  }
  if (meta?.pluginId && activePluginIds && !activePluginIds.includes(meta.pluginId)) return false
  return true
}

function toNavLink(node: RouteTreeNode, meta: RouterMeta): NavLink {
  const external = Boolean(meta.link)
  return {
    title: meta.title ?? '',
    url: (meta.link ?? node.fullPath) as NavLink['url'],
    external: external || undefined,
    icon: meta.icon,
    permissions: meta.permissions
  }
}

function flattenToLinks(entries: NavEntry[]): NavCollapsible['items'] {
  const links: NavCollapsible['items'] = []
  for (const entry of entries) {
    const { item } = entry
    if ('items' in item && item.items) {
      if (import.meta.env.DEV) {
        console.warn(`[nav] 暂不支持三级菜单，已拍平父级「${item.title}」下的子项`)
      }
      for (const sub of item.items) {
        links.push(sub)
      }
      continue
    }
    if ('url' in item && item.url) {
      links.push({
        title: item.title,
        url: item.url,
        external: item.external,
        icon: item.icon,
        permissions: item.permissions,
        badge: item.badge,
        show: item.show
      })
    }
  }
  return links
}

/**
 * 从某层 children 收集侧栏菜单项（支持 pathless layout 作为折叠父级）。
 * - 有 title 的非叶子 → NavCollapsible
 * - 无 title 的 layout → 只展开子项
 * - 叶子且有 title → NavLink
 */
function collectFromChildren(
  children: readonly RouteTreeNode[],
  permissions: readonly string[],
  activePluginIds: readonly string[] | undefined,
  unrestricted = false
): NavEntry[] {
  const entries: NavEntry[] = []

  for (const child of children) {
    if (isErrorPath(child.fullPath)) continue

    const meta = getMeta(child)
    if (!passesGate(meta, permissions, activePluginIds, unrestricted)) continue

    const kids = getChildren(child)

    if (kids.length > 0) {
      const nested = collectFromChildren(kids, permissions, activePluginIds, unrestricted)

      if (meta?.title && !meta.hideInMenu) {
        const orderedLinks = [...nested]
          .sort((a, b) => a.order - b.order || a.item.title.localeCompare(b.item.title, 'zh-CN'))
          .flatMap((entry) => flattenToLinks([entry]))

        if (orderedLinks.length === 0) continue

        entries.push({
          order: meta.order ?? DEFAULT_ORDER,
          item: {
            title: meta.title,
            icon: meta.icon,
            permissions: meta.permissions,
            items: orderedLinks
          }
        })
        continue
      }

      entries.push(...nested)
      continue
    }

    if (!meta?.title || meta.hideInMenu) continue

    entries.push({
      order: meta.order ?? DEFAULT_ORDER,
      item: toNavLink(child, meta)
    })
  }

  return entries
}

/** 从路由 id 取末段 slug，如 `/_authenticated/system` → `system` */
function routeSlug(node: RouteTreeNode): string {
  const id = node.id ?? node.fullPath
  const segments = id.split('/').filter(Boolean)
  return segments.at(-1) ?? id
}

function groupTitleFromNode(node: RouteTreeNode): string {
  const meta = getMeta(node)
  if (meta?.title) return meta.title
  const slug = routeSlug(node)
  return slug.startsWith('_') ? slug.slice(1) : slug
}

function findAuthenticatedRoot(root: RouteTreeNode): RouteTreeNode | undefined {
  if (root.id === '/_authenticated') return root

  for (const child of getChildren(root)) {
    if (isErrorPath(child.fullPath)) continue
    if (child.id === '/_authenticated') return child
    const nested = findAuthenticatedRoot(child)
    if (nested) return nested
  }

  return undefined
}

function sortGroupBuckets(buckets: GroupBucket[]): GroupBucket[] {
  return [...buckets].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))
}

/**
 * 从路由树生成侧边栏：大组 = `_authenticated` 直接子目录；组内由 title / pathless 折叠驱动。
 */
export function buildNavGroupsFromRouteTree(
  root: RouteTreeNode,
  permissions: readonly string[],
  activePluginIds?: readonly string[],
  unrestricted = false
): NavGroup[] {
  const authRoot = findAuthenticatedRoot(root) ?? root
  const groupNodes = getChildren(authRoot)
  const buckets: GroupBucket[] = []

  for (const groupNode of groupNodes) {
    if (isErrorPath(groupNode.fullPath)) continue

    const meta = getMeta(groupNode)
    if (!passesGate(meta, permissions, activePluginIds, unrestricted)) continue

    const kids = getChildren(groupNode)
    const entries =
      kids.length > 0
        ? collectFromChildren(kids, permissions, activePluginIds, unrestricted)
        : collectFromChildren([groupNode], permissions, activePluginIds, unrestricted)

    if (entries.length === 0) continue

    entries.sort((a, b) => a.order - b.order || a.item.title.localeCompare(b.item.title, 'zh-CN'))

    buckets.push({
      slug: routeSlug(groupNode),
      title: groupTitleFromNode(groupNode),
      order: meta?.order ?? DEFAULT_ORDER,
      entries
    })
  }

  return sortGroupBuckets(buckets).map((bucket) => ({
    title: bucket.title,
    items: bucket.entries.map((entry) => entry.item)
  }))
}

function findRouteTreeNode(root: RouteTreeNode, idOrPath: AppPath): RouteTreeNode | undefined {
  if (root.id === idOrPath || root.fullPath === idOrPath) return root
  for (const child of getChildren(root)) {
    const found = findRouteTreeNode(child, idOrPath)
    if (found) return found
  }
  return undefined
}

/**
 * 从指定父路由的子树生成扁平导航链接（如 Settings 页内二级侧栏）。
 * 复用主侧栏的 title / icon / order / hideInMenu / permissions 约定。
 */
export function buildChildNavLinksFromRouteTree(
  root: RouteTreeNode,
  parentIdOrPath: AppPath,
  permissions: readonly string[] = [],
  activePluginIds?: readonly string[],
  unrestricted = false
): NavLink[] {
  const parent = findRouteTreeNode(root, parentIdOrPath)
  if (!parent) return []

  const entries = collectFromChildren(
    getChildren(parent),
    permissions,
    activePluginIds,
    unrestricted
  )
  entries.sort((a, b) => a.order - b.order || a.item.title.localeCompare(b.item.title, 'zh-CN'))

  return flattenToLinks(entries)
}

/** @deprecated 使用 buildNavGroupsFromRouteTree；保留扁平接口仅作兼容 */
export type RouteNavSource = {
  fullPath: string
  staticData?: RouterMeta
}

/** @deprecated 使用 buildNavGroupsFromRouteTree */
export function buildNavGroupsFromRoutes(
  routes: readonly RouteNavSource[],
  permissions: readonly string[],
  activePluginIds?: readonly string[]
): NavGroup[] {
  const fakeRoot: RouteTreeNode = {
    fullPath: '/',
    id: '/_authenticated',
    children: routes.map((route) => ({
      fullPath: route.fullPath,
      options: { staticData: route.staticData }
    }))
  }
  return buildNavGroupsFromRouteTree(fakeRoot, permissions, activePluginIds)
}
