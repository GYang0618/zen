import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'
import { z } from 'zod'

import { Organizations } from '@/features/system/organization/organizations'

const organizationSearchSchema = z.object({
  view: z.enum(['graph', 'tree']).optional().catch(undefined),
  keyword: z.string().trim().min(1).optional().catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/_identity/organization')({
  component: Organizations,
  validateSearch: organizationSearchSchema,
  loaderDeps: ({ search }) => search,
  staticData: {
    title: '组织管理',
    description: '企业组织架构管理，管理部门、团队、分支机构与岗位编制关联',
    icon: FolderKanban,
    permissions: ['system:org:list']
  }
})
