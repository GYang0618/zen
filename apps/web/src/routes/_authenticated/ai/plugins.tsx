import { createFileRoute } from '@tanstack/react-router'
import { Puzzle } from 'lucide-react'

import { PluginMarketPage } from '@/features/plugin-market'

export const Route = createFileRoute('/_authenticated/ai/plugins')({
  component: PluginMarketPage,
  staticData: {
    title: '插件',
    description: '为智能体安装可复用的插件能力。',
    icon: Puzzle,
    order: 3,
    hideInMenu: true
  }
})
