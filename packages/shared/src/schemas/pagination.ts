import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE).describe('页码，默认为1'),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe(`每页数量，默认为${DEFAULT_PAGE_SIZE}，最大为${MAX_PAGE_SIZE}`)
})

export const pageMetaSchema = z.object({
  total: z.number(),
  totalPages: z.number(),
  page: z.number(),
  pageSize: z.number()
})

/**
 * 标准列表响应：items + 分页元信息（与 `paginate` 实现一致）
 */
export function paged<TItem extends z.ZodTypeAny>(item: TItem) {
  return z.object({
    items: z.array(item),
    pagination: pageMetaSchema
  })
}
