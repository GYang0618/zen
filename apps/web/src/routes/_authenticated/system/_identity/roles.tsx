import { createFileRoute } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { z } from 'zod'

import { Roles } from '@/features/system/roles'

const rolesSearchSchema = z.object({
  keyword: z.string().trim().min(1).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  pageSize: z.coerce.number().int().positive().max(100).optional().catch(undefined),
  status: z.array(z.string()).optional().catch(undefined),
  dataScope: z.array(z.string()).optional().catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/_identity/roles')({
  component: Roles,
  validateSearch: rolesSearchSchema,
  staticData: {
    title: '角色管理',
    icon: KeyRound,
    order: 20,
    permissions: ['system:role:list']
  }
})
