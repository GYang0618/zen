import { z } from 'zod'

export const paginationMetaSchema = z.object({
  total: z.number(),
  totalPages: z.number(),
  page: z.number(),
  pageSize: z.number()
})

export function makePaginatedOutputSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    pagination: paginationMetaSchema
  })
}

export type PaginationMeta = z.infer<typeof paginationMetaSchema>
