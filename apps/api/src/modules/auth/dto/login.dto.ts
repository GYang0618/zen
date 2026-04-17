import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, '账号是必填项').max(64, '账号长度不能超过64个字符'),
  password: z.string().min(1, '密码是必填项')
})

export type LoginDto = z.infer<typeof loginSchema>
