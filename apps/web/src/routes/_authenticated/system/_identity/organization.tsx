import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'

import { Organizations } from '@/features/system/organization/organizations'

export const Route = createFileRoute('/_authenticated/system/_identity/organization')({
  component: Organizations,
  staticData: {
    title: '组织管理',
    description: '企业组织架构管理，管理分公司、部门、业务中心与岗位编制关联',
    icon: FolderKanban,
    permissions: ['system:org:list']
  }
})
