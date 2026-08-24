import { z } from 'zod'

const MIN_BIRTHDAY = '1900-01-01'

function isAcceptableBirthday(value: string) {
  if (value < MIN_BIRTHDAY) return false
  const limit = new Date()
  limit.setUTCDate(limit.getUTCDate() + 1)
  return value <= limit.toISOString().slice(0, 10)
}

const birthdaySchema = z.iso
  .date()
  .refine(isAcceptableBirthday, {
    message: '出生日期必须介于 1900-01-01 与今天之间'
  })
  .describe('出生日期（YYYY-MM-DD）')

export const updateMyProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(50).optional(),
  phoneNumber: z.string().trim().min(5).max(20).nullable().optional(),
  bio: z.string().trim().max(160).nullable().optional(),
  avatar: z.string().trim().max(2048).nullable().optional(),
  birthday: birthdaySchema.nullable().optional(),
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
