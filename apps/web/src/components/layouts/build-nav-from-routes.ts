import { hasAnyPermission } from '@zen/shared'
import {
  BookOpen,
  BotMessageSquare,
  Building2,
  Cuboid,
  FolderKanban,
  Globe,
  KeyRound,
  LayoutDashboard,
  MessageCircleMore,
  Puzzle,
  ScrollText,
  Settings,
  Shield,
  StickyNote,
  UserRoundCog
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type { RouterMeta } from '@/types/router'
import type { NavGroup, NavItem } from './types'

const ICON_MAP: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  users: UserRoundCog,
  'user-round-cog': UserRoundCog,
  'key-round': KeyRound,
  'folder-kanban': FolderKanban,
  building2: Building2,
  'message-circle-more': MessageCircleMore,
  'bot-message-square': BotMessageSquare,
  cuboid: Cuboid,
  globe: Globe,
  'sticky-note': StickyNote,
  shield: Shield,
  book: BookOpen,
  'scroll-text': ScrollText,
  puzzle: Puzzle,
  settings: Settings
}

export type RouteNavSource = {
  fullPath: string
  staticData?: RouterMeta
}

function resolveIcon(icon?: RouterMeta['icon']): LucideIcon | undefined {
  if (!icon) return undefined
  if (typeof icon !== 'string') return icon
  return ICON_MAP[icon]
}

/**
 * 从路由 staticData 生成侧边栏（菜单单源）。
 * 仅收录带 title、未 hideInMenu、且权限通过的路由。
 * 若 staticData.link 有值，菜单 url 使用该外链并标记 external（新标签页打开）。
 */
export function buildNavGroupsFromRoutes(
  routes: readonly RouteNavSource[],
  permissions: readonly string[],
  activePluginIds?: readonly string[]
): NavGroup[] {
  const candidates = routes
    .map((route) => {
      const meta = route.staticData
      if (!meta?.title || meta.hideInMenu) return null
      if (route.fullPath.includes('/errors/')) return null
      if (meta.permissions && !hasAnyPermission(permissions, meta.permissions)) return null
      if (meta.pluginId && activePluginIds && !activePluginIds.includes(meta.pluginId)) {
        return null
      }

      const external = Boolean(meta.link)
      return {
        title: meta.title,
        // RouterMeta.link 优先：外链 URL；否则使用内部路由 path
        url: (meta.link ?? route.fullPath) as NavItem extends { url: infer U } ? U : string,
        external: external || undefined,
        icon: resolveIcon(meta.icon),
        permissions: meta.permissions,
        group: meta.group ?? '工作台',
        order: meta.order ?? 100
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))

  const groupMap = new Map<string, NavItem[]>()
  const groupOrder: string[] = []

  for (const item of candidates) {
    if (!groupMap.has(item.group)) {
      groupMap.set(item.group, [])
      groupOrder.push(item.group)
    }
    groupMap.get(item.group)?.push({
      title: item.title,
      url: item.url,
      external: item.external,
      icon: item.icon,
      permissions: item.permissions
    })
  }

  return groupOrder.map((title) => ({
    title,
    items: groupMap.get(title) ?? []
  }))
}
