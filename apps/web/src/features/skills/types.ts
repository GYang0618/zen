import type { LucideIcon } from 'lucide-react'

export type SkillCategory = '全部' | '效率' | '开发' | '数据' | '内容' | '集成'
export type MarketTab = 'explore' | 'installed'
export type SkillSort = 'popular' | 'updated' | 'name'

export type Skill = {
  id: string
  name: string
  description: string
  category: Exclude<SkillCategory, '全部'>
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
