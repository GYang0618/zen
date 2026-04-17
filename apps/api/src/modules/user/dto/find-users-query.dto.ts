import { z } from 'zod'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

export const findUsersQuerySchema = z.object({
  keyword: z.string().trim().optional().describe('关键字搜索：支持邮箱、用户名、昵称、手机号'),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE).describe('页码，默认为1'),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe('每页数量，默认为10，最大为100')
})

export type FindUsersQueryDto = z.input<typeof findUsersQuerySchema>
