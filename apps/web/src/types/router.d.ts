import type { LucideIcon } from 'lucide-react'

export interface RouterMeta {
  title?: string
  /** 菜单图标 */
  icon?: string | LucideIcon
  /** 需要的权限码（支持多个，满足其一即可） */
  permissions?: string[]
  /** 需要的角色（支持多个，满足其一即可） */
  roles?: string[]
  /** 是否在菜单中隐藏 */
  hideInMenu?: boolean
  /** 是否在面包屑中隐藏 */
  hideInBreadcrumb?: boolean
  /** 是否缓存（keep-alive） */
  keepAlive?: boolean
  /** 固定在标签页 */
  affix?: boolean
  /** 菜单排序（升序） */
  order?: number
  /** 外链地址 */
  link?: string
  /** 菜单分组 */
  group?: string
}
