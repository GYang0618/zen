import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('无效的邮箱地址'),
  password: z.string().min(1, '密码是必填项')
})

export type LoginDto = z.infer<typeof loginSchema>
