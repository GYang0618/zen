import { z } from 'zod'

export const createNotificationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
  userId: z.string().min(1).optional()
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>

export interface NotificationDto {
  id: string
  tenantId: string
  userId: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}
