import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'

import { Organizations } from '@/features/system/organization-v2/organizations'

export const Route = createFileRoute('/_authenticated/system/_identity/organization-v2')({
  component: Organizations,
  staticData: {
    title: '组织管理 (V2)',
    icon: FolderKanban
  }
})
