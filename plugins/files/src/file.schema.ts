import { z } from 'zod'

export const createFileSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(255).optional(),
  size: z.number().int().nonnegative().optional(),
  storageKey: z.string().trim().min(1).optional()
})

export type CreateFileInput = z.infer<typeof createFileSchema>

export interface StoredFileDto {
  id: string
  tenantId: string
  ownerId: string
  filename: string
  mimeType: string | null
  size: number
  storageKey: string
  url: string
  createdAt: string
  updatedAt: string
}
