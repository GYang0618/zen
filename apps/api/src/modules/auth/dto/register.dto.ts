import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3, '用户名必须至少包含3个字符'),
  email: z.email({ error: '无效的邮箱地址' }),
  password: z
    .string()
    .min(8, '密码必须至少包含8个字符')
    .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
    .regex(/[a-z]/, '密码必须包含至少一个小写字母')
    .regex(/\d/, '密码必须包含至少一个数字')
    .regex(/[\W_]/, '密码必须包含至少一个特殊字符')
})

export type RegisterDto = z.infer<typeof registerSchema>
