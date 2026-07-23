import { z } from 'zod'

export const createDemoNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(10000).optional(),
  organizationId: z.string().min(1).optional()
})

export const updateDemoNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().max(10000).nullable().optional(),
  organizationId: z.string().min(1).optional()
})

export type CreateDemoNoteInput = z.infer<typeof createDemoNoteSchema>
export type UpdateDemoNoteInput = z.infer<typeof updateDemoNoteSchema>

export interface DemoNoteDto {
  id: string
  tenantId: string
  organizationId: string
  title: string
  content: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}
