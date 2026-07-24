import { z } from 'zod'

export const updateMyProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(50).optional(),
  phoneNumber: z.string().trim().min(5).max(20).nullable().optional(),
  bio: z.string().trim().max(160).nullable().optional(),
  avatar: z.string().trim().url().nullable().optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      notifyByEmail: z.boolean().optional(),
      notifyByPush: z.boolean().optional(),
      notifyBySms: z.boolean().optional()
    })
    .optional()
})

export type UpdateMyProfile = z.infer<typeof updateMyProfileSchema>
