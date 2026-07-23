import { z } from 'zod'

export const createJobSchema = z.object({
  name: z.string().trim().min(1).max(200),
  payload: z.unknown().optional()
})

export type CreateJobInput = z.infer<typeof createJobSchema>

export interface JobDto {
  id: string
  tenantId: string
  name: string
  status: string
  payload: unknown
  result: unknown
  createdBy: string | null
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}
