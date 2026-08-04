import type { LinkProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

/**
 * 路由 `staticData` 元数据（菜单 / 面包屑 / 权限门控的唯一来源）。
 *
 * 侧栏层级约定：
 * - `_authenticated` 的直接子 layout：`title` 仅作大组标签，不渲染为菜单项
 * - pathless layout 带 `title`：一级折叠菜单（如 `_identity`）
 * - 叶子带 `title` 且未 `hideInMenu`：链接菜单项
 */
export interface RouterMeta {
  /**
   * 展示标题。
   * - 组根 layout：侧栏 `SidebarGroupLabel`
   * - pathless 父级：折叠菜单标题
   * - 叶子：菜单 / 面包屑 / 页签标题
   */
  title?: string
  /** 菜单图标（Lucide 组件） */
  icon?: LucideIcon
  /** 所需权限码（满足其一即可进入路由与菜单） */
  permissions?: string[]
  /** 所需角色（满足其一即可；预留） */
  roles?: string[]
  /** 为 true 时不出现在侧栏菜单 */
  hideInMenu?: boolean
  /** 为 true 时不出现在面包屑 */
  hideInBreadcrumb?: boolean
  /** 是否缓存页面（keep-alive，预留） */
  keepAlive?: boolean
  /** 固定在多页签栏，不可关闭 */
  affix?: boolean
  /** 同组内菜单排序，升序；默认 100 */
  order?: number
  /** 外链地址；有值时菜单以新标签打开该 URL */
  link?: string
  /** 编译期插件 ID；插件未启用时菜单与路由不可见 */
  pluginId?: string
  /** 页面描述 */
  description?: string
}

declare module '@tanstack/react-router' {
  /** 与 `createFileRoute({ staticData })` / `match.staticData` 对齐 */
  interface StaticDataRouteOption extends RouterMeta {}
}

export type AppPath = LinkProps['to']
