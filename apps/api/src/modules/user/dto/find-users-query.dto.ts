import { z } from 'zod'

import { paginationQuerySchema } from '@/common/pagination'

export const userStatusSchema = z.union([
  z.literal('active').describe('激活'),
  z.literal('inactive').describe('未激活'),
  z.literal('pending').describe('待审核'),
  z.literal('suspended').describe('已停用')
])

export const findUsersQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional().describe('关键字搜索：支持邮箱、用户名、昵称、手机号'),
  status: z
    .union([userStatusSchema, userStatusSchema.array()])
    .optional()
    .describe('状态,支持单个或多个'),
  role: z.union([z.string(), z.string().array()]).optional().describe('角色,支持单个或多个')
})

export type FindUsersQueryDto = z.input<typeof findUsersQuerySchema>
export type UserStatus = z.infer<typeof userStatusSchema>
