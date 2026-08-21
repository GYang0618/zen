import { createFileRoute } from '@tanstack/react-router'
import { jobProfileStatusSchema } from '@zen/shared'
import { BriefcaseBusiness } from 'lucide-react'
import { z } from 'zod'

import { Posts } from '@/features/system/posts'

const postsSearchSchema = z.object({
  keyword: z.string().trim().min(1).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  pageSize: z.coerce.number().int().positive().max(100).optional().catch(undefined),
  status: z
    .union([jobProfileStatusSchema, jobProfileStatusSchema.array()])
    .optional()
    .catch(undefined)
})

export const Route = createFileRoute('/_authenticated/system/_identity/posts')({
  component: Posts,
  validateSearch: postsSearchSchema,
  staticData: {
    title: '岗位管理',
    description: '维护可跨组织复用的岗位目录标准',
    icon: BriefcaseBusiness,
    order: 25,
    permissions: ['system:post:list']
  }
})
