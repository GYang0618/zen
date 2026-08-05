import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'

import { Organizations } from '@/features/system/organization-v2/organizations'

export const Route = createFileRoute('/_authenticated/system/_identity/organization-v2')({
  component: Organizations,
  staticData: {
    title: '组织管理 (V2)',
    description: '企业组织架构管理，管理分公司、部门、业务中心、岗位等',
    icon: FolderKanban
  }
})
