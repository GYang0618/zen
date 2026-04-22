import { z } from 'zod'

import { paginationQuerySchema } from '@/common/pagination'

export const userStatusSchema = z.union([
  z.literal('active').describe('激活'),
  z.literal('inactive').describe('未激活'),
  z.literal('pending').describe('待审核'),
  z.literal('suspended').describe('已停用')
])

/** 将单值 query 参数兼容为数组（Fastify 在只有一个同名参数时解析为字符串） */
const toArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined
    return Array.isArray(value) ? value : [value]
  }, schema.array())

export const findUsersQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().optional().describe('关键字搜索：支持邮箱、用户名、昵称、手机号'),
  status: toArray(userStatusSchema).optional().describe('状态,支持多个'),
  role: toArray(z.string()).optional().describe('角色,支持多个')
})

export type FindUsersQueryDto = z.input<typeof findUsersQuerySchema>
export type UserStatus = z.infer<typeof userStatusSchema>
