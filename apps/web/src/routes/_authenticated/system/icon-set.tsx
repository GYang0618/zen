import { createFileRoute } from '@tanstack/react-router'
import { Shapes } from 'lucide-react'

import { IconSetPage } from '@/features/system/icon-set'

export const Route = createFileRoute('/_authenticated/system/icon-set')({
  component: IconSetPage,
  staticData: {
    title: '图标集',
    description: '浏览并搜索 Lucide React 全部图标',
    icon: Shapes,
    order: 50
  }
})
