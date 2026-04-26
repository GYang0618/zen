import type { z } from 'zod'
import type { pageMetaSchema, pageQuerySchema } from '../schemas/pagination'

export type PageQueryInput = z.input<typeof pageQuerySchema>
export type PageQuery = z.output<typeof pageQuerySchema>
export type PageMeta = z.infer<typeof pageMetaSchema>
export type Paged<T> = { items: T[]; pagination: PageMeta }
