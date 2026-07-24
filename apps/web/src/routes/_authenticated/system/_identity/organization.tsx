import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'

import { Organizations } from '@/features/system/organization'

export const Route = createFileRoute('/_authenticated/system/_identity/organization')({
  component: Organizations,
  staticData: {
    title: '组织架构',
    icon: FolderKanban,
    order: 30,
    permissions: ['system:org:list']
  }
})
