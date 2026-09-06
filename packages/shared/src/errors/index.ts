import { z } from 'zod'

export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'TIMEOUT',
  'CANCELLED',
  'NETWORK_ERROR',
  'TOOL_UNAVAILABLE',
  'APPROVAL_REQUIRED',
  'APPROVAL_EXPIRED',
  'BUDGET_EXCEEDED',
  'INTERNAL_ERROR'
])

export const apiErrorResponseSchema = z.object({
  code: z.number().int().min(400).max(599),
  reason: z.string().nullable(),
  message: z.string(),
  path: z.string(),
  traceId: z.string(),
  timestamp: z.iso.datetime(),
  error: z.unknown().nullable(),
  fieldErrors: z.record(z.string(), z.array(z.string())).nullable(),
  formErrors: z.array(z.string()).nullable()
})

export type ErrorCode = z.infer<typeof errorCodeSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
