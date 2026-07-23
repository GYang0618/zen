import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.email('无效的邮箱格式').describe('注册邮箱')
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(16).describe('重置令牌'),
  password: z
    .string()
    .min(8, '密码必须至少有8个字符')
    .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
    .regex(/[a-z]/, '密码必须包含至少一个小写字母')
    .regex(/\d/, '密码必须包含至少一个数字')
    .regex(/[\W_]/, '密码必须包含至少一个特殊字符')
    .describe('新密码')
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).describe('当前密码').optional(),
  newPassword: z
    .string()
    .min(8, '密码必须至少有8个字符')
    .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
    .regex(/[a-z]/, '密码必须包含至少一个小写字母')
    .regex(/\d/, '密码必须包含至少一个数字')
    .regex(/[\W_]/, '密码必须包含至少一个特殊字符')
    .describe('新密码')
})

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>
export type ResetPassword = z.infer<typeof resetPasswordSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>
