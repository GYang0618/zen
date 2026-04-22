import { z } from 'zod'

export const userStatusSchema = z.union([
  z.literal('active').describe('激活'),
  z.literal('inactive').describe('未激活'),
  z.literal('pending').describe('待审核'),
  z.literal('suspended').describe('已停用')
])

export const userRoleSchema = z.union([
  z.literal('super_admin').describe('超级管理员'),
  z.literal('admin').describe('管理员'),
  z.literal('guest').describe('访客')
])

const userSchema = z.object({
  id: z.string().describe('用户ID'),
  username: z.string().describe('用户名'),
  email: z.string().describe('邮箱'),
  avatar: z.string().optional().describe('头像'),
  nickname: z.string().optional().describe('昵称'),
  phoneNumber: z.string().optional().describe('手机号码'),
  status: userStatusSchema.describe('状态'),
  role: userRoleSchema.describe('角色'),
  permissions: z.array(z.string()).describe('权限'),
  createdAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间')
})

export type UserStatus = z.infer<typeof userStatusSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type User = z.infer<typeof userSchema>
