import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Users } from '@/features/system/users'

const usersSearchSchema = z.object({
  keyword: z.string().trim().min(1).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  pageSize: z.coerce.number().int().positive().max(100).optional().catch(undefined),
  status: z.array(z.string()).optional().catch(undefined),
  role: z.array(z.string()).optional().catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/users')({
  component: Users,
  validateSearch: usersSearchSchema,
  staticData: {
    title: '用户管理',
    icon: 'users',
    roles: ['admin'],
    group: '系统管理',
    permissions: ['system:user:list']
  }
})
