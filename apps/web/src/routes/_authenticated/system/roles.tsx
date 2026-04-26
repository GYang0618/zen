import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Roles } from '@/features/system/roles'

const rolesSearchSchema = z.object({
  keyword: z.string().trim().min(1).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  pageSize: z.coerce.number().int().positive().max(100).optional().catch(undefined),
  status: z.array(z.string()).optional().catch(undefined),
  dataScope: z.array(z.string()).optional().catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/roles')({
  component: Roles,
  validateSearch: rolesSearchSchema,
  staticData: {
    title: '角色管理',
    icon: 'key-round',
    roles: ['admin'],
    permissions: ['system:role:list'],
    group: '系统管理'
  }
})
