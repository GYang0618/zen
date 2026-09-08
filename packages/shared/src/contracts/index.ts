import { z } from 'zod'

export * from '../agent/index.js'
export * from '../errors/index.js'
export * from '../pagination/index.js'
export * from '../security/index.js'

export function apiResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({
    code: z.number().int(),
    message: z.string(),
    data,
    traceId: z.string(),
    timestamp: z.iso.datetime()
  })
}

export type ApiResponse<T> = Omit<z.infer<ReturnType<typeof apiResponseSchema>>, 'data'> & {
  data: T
}
