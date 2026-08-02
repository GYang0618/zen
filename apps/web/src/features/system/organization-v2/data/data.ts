import {
  Briefcase,
  Building,
  Building2,
  Component,
  FolderTree,
  Network,
  UserCircle,
  Users
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
export const organizationIconConfig: Record<string, { icon: LucideIcon; defaultColor: string }> = {
  GROUP: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  COMPANY: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  BRANCH: { icon: Building, defaultColor: 'text-indigo-500' },
  CENTER: { icon: Component, defaultColor: 'text-violet-500' },
  DEPARTMENT: { icon: FolderTree, defaultColor: 'text-amber-500' },
  TEAM: { icon: Users, defaultColor: 'text-emerald-500' },
  POST: { icon: Briefcase, defaultColor: 'text-rose-500' },
  USER: { icon: UserCircle, defaultColor: 'text-slate-500' }
} as const
