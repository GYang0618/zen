import { z } from 'zod'

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少需要3个字符')
    .max(30, '用户名不能超过30个字符')
    .describe('用户名'),
  email: z.email('无效的邮箱格式').describe('邮箱'),
  password: z
    .string()
    .min(8, '密码必须至少有8个字符')
    .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
    .regex(/[a-z]/, '密码必须包含至少一个小写字母')
    .regex(/\d/, '密码必须包含至少一个数字')
    .regex(/[\W_]/, '密码必须包含至少一个特殊字符')
    .describe('密码'),
  nickname: z.string().max(50, '昵称不能超过50个字符').describe('昵称').optional(),
  phone: z.string().max(20, '手机号不能超过20个字符').describe('手机号').optional()
})

export type CreateUserDto = z.infer<typeof createUserSchema>
