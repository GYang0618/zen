import { IconZen, IconZenAgent } from '@/components/icons'

import type { ComponentType, SVGProps } from 'react'
import type { ShellMode } from '@/stores'

type ShellModeIcon = ComponentType<SVGProps<SVGSVGElement>>

export type ShellModeMeta = {
  name: string
  description: string
  switchLabel: string
  icon: ShellModeIcon
}

export const SHELL_MODE_META = {
  agent: {
    name: '智能体',
    description: '对话驱动任务',
    switchLabel: '切换到智能体模式',
    icon: IconZenAgent
  },
  admin: {
    name: '管理后台',
    description: '菜单与页面操作',
    switchLabel: '切换到管理后台',
    icon: IconZen
  }
} as const satisfies Record<ShellMode, ShellModeMeta>
