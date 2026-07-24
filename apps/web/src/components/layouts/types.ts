import type { LinkProps } from '@tanstack/react-router'
import type { ComponentType } from 'react'

type NavIcon = ComponentType<{ className?: string }>

export type User = {
  name: string
  email: string
  avatar: string
}

export type Team = {
  name: string
  logo: NavIcon
  plan: string
}

export type BaseNavItem = {
  title: string
  badge?: string
  show?: boolean
  icon?: NavIcon
  /** 所需权限码（满足其一即可显示） */
  permissions?: string[]
  /** 外链：在新标签页打开 url */
  external?: boolean
}

export type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

export type NavItem = NavCollapsible | NavLink

export type NavGroup = {
  title: string
  items: NavItem[]
}

export type SidebarData = {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}
