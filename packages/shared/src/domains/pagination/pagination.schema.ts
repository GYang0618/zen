import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export const pageQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .describe(`页码，可选；只传 pageSize 时默认 ${DEFAULT_PAGE}`),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .optional()
    .describe(`每页数量，可选；只传 page 时默认 ${DEFAULT_PAGE_SIZE}，最大 ${MAX_PAGE_SIZE}`)
})

function toPageNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined
}

/** 只传 page 或 pageSize 时补全另一项；两项都缺则保持不分页。 */
export function completePageQuery<T extends { page?: unknown; pageSize?: unknown }>(query: T): T {
  const page = toPageNumber(query.page)
  const pageSize = toPageNumber(query.pageSize)
  const hasPage = page !== undefined
  const hasPageSize = pageSize !== undefined
  if (hasPage === hasPageSize) {
    return hasPage ? { ...query, page, pageSize } : query
  }
  return {
    ...query,
    page: page ?? DEFAULT_PAGE,
    pageSize: pageSize ?? DEFAULT_PAGE_SIZE
  }
}

export const pageMetaSchema = z.object({
  total: z.number(),
  totalPages: z.number(),
  page: z.number(),
  pageSize: z.number()
})

/**
 * 标准列表响应：items + 分页元信息（与 `paginate` 实现一致）
 */
export function paged<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    pagination: pageMetaSchema
  })
}
