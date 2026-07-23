import { createFileRoute } from '@tanstack/react-router'
import { userStatusSchema, usersSortBySchema, usersSortOrderSchema } from '@zen/shared'
import { z } from 'zod'

import { Users } from '@/features/system/users'

const usersSearchSchema = z.object({
  keyword: z.string().trim().min(1).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  pageSize: z.coerce.number().int().positive().max(100).optional().catch(undefined),
  status: z.union([userStatusSchema, userStatusSchema.array()]).optional().catch(undefined),
  role: z.union([z.string(), z.string().array()]).optional().catch(undefined),
  sortBy: usersSortBySchema.optional().catch(undefined),
  sortOrder: usersSortOrderSchema.optional().catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/users')({
  component: Users,
  validateSearch: usersSearchSchema,
  staticData: {
    title: '用户管理',
    icon: 'users',
    group: '系统管理',
    order: 10,
    permissions: ['system:user:list']
  }
})
