import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'
import { z } from 'zod'

import { Organizations } from '@/features/system/organization'

const organizationSearchSchema = z.object({
  orgId: z.string().trim().min(1).optional().catch(undefined),
  keyword: z.string().trim().min(1).optional().catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/_identity/organization')({
  component: Organizations,
  validateSearch: organizationSearchSchema,
  staticData: {
    title: '组织架构',
    description: '维护统一组织树、岗位编制与人员花名册',
    icon: FolderKanban,
    order: 30,
    permissions: ['system:org:list']
  }
})
