import type { LucideIcon } from 'lucide-react'

export type PluginCategory = '全部' | '效率' | '开发' | '数据' | '内容' | '集成'
export type MarketTab = 'explore' | 'installed'
export type PluginSort = 'popular' | 'updated' | 'name'

export type Plugin = {
  id: string
  name: string
  description: string
  category: Exclude<PluginCategory, '全部'>
  publisher: string
  installs: string
  version: string
  updated: string
  icon: LucideIcon
  iconClassName: string
  installed?: boolean
  verified?: boolean
  featured?: boolean
  capabilities: string[]
}
