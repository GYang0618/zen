import { createFileRoute } from '@tanstack/react-router'
import { Puzzle } from 'lucide-react'

import { PluginsPage } from '@/features/system/plugins'

export const Route = createFileRoute('/_authenticated/system/plugins')({
  component: PluginsPage,
  staticData: {
    title: '插件管理',
    icon: Puzzle,
    order: 70,
    permissions: ['system:plugin:list']
  }
})
