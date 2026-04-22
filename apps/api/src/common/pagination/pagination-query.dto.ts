import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

/** 通用分页查询 schema，其他模块可通过 `.extend` 拓展自身业务字段 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE).describe('页码，默认为1'),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe(`每页数量，默认为${DEFAULT_PAGE_SIZE}，最大为${MAX_PAGE_SIZE}`)
})

/** 请求侧（外部输入）：所有字段可选，由 schema 填充默认值 */
export type PaginationQueryDto = z.input<typeof paginationQuerySchema>

/** 解析后（内部使用）：已经具备默认值 */
export type PaginationQuery = z.output<typeof paginationQuerySchema>
