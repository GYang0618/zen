import { z } from 'zod'

import { organizationTypeSchema } from '../organization/organization.schema'
import { paged, pageQuerySchema } from '../pagination'

export const userStatusSchema = z.union([
  z.literal('active').describe('激活，账号正常可用'),
  z.literal('inactive').describe('未激活，仅用于账号尚未完成激活流程，不表示管理员禁用'),
  z.literal('pending').describe('待审核，账号等待审批'),
  z.literal('suspended').describe('已停用/已禁用/已封禁，用于管理员禁用账户')
])

export const userGenderSchema = z.union([
  z.literal('male').describe('男'),
  z.literal('female').describe('女'),
  z.literal('unknown').describe('未知')
])

export const userMfaTypeSchema = z.union([
  z.literal('totp'),
  z.literal('sms'),
  z.literal('email'),
  z.literal('off')
])

export const userPasswordSchema = z
  .string()
  .min(8, '密码必须至少有8个字符')
  .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
  .regex(/[a-z]/, '密码必须包含至少一个小写字母')
  .regex(/\d/, '密码必须包含至少一个数字')
  .regex(/[\W_]/, '密码必须包含至少一个特殊字符')
  .describe('密码')

const usernameSchema = z
  .string()
  .trim()
  .min(3, '用户名至少需要3个字符')
  .max(30, '用户名不能超过30个字符')
  .describe('用户名，创建后不可修改')

const nicknameSchema = z.string().trim().max(50, '昵称不能超过50个字符')
const realNameSchema = z.string().trim().max(50, '真实姓名不能超过50个字符')
const phoneNumberSchema = z.string().trim().max(20, '手机号码不能超过20个字符')
const remarkSchema = z.string().trim().max(500, '备注不能超过500个字符')

export const userRolePreviewSchema = z.object({
  id: z.string().describe('角色 ID'),
  code: z.string().describe('角色编码'),
  name: z.string().describe('角色名称'),
  description: z.string().nullable().describe('角色描述'),
  icon: z.string().nullable().describe('角色图标'),
  iconColor: z.string().nullable().describe('图标颜色'),
  kind: z.union([z.literal('system'), z.literal('custom')]).describe('角色种类'),
  status: z.union([z.literal('active'), z.literal('disabled')]).describe('角色状态'),
  permissionCount: z.number().int().nonnegative().describe('权限数量')
})

export const userOrganizationMembershipSchema = z.object({
  organizationId: z.string().describe('组织 ID'),
  organizationName: z.string().describe('组织名称'),
  organizationCode: z.string().describe('组织编码'),
  organizationType: organizationTypeSchema.describe('组织类型'),
  isPrimary: z.boolean().describe('是否主职'),
  postId: z.string().nullable().describe('岗位 ID'),
  postName: z.string().nullable().describe('岗位名称'),
  postLevel: z.string().nullable().describe('岗位职级'),
  joinedAt: z.string().nullable().describe('入职时间（ISO 8601）')
})

export const userOrganizationInputSchema = z.object({
  organizationId: z.string().trim().min(1, '组织 ID 不能为空').describe('组织 ID'),
  isPrimary: z.boolean().optional().describe('是否主职'),
  postId: z.string().trim().min(1).nullable().optional().describe('岗位 ID')
})

/**
 * 管理端列表与详情共用。偏好设置仍走 `/auth/me`，不进入用户管理协议。
 */
export const userSchema = z.object({
  id: z.string().describe('用户 ID'),
  username: z.string().describe('用户名'),
  nickname: z.string().nullable().describe('昵称'),
  realName: z.string().nullable().describe('真实姓名'),
  avatar: z.string().nullable().describe('头像'),
  gender: userGenderSchema.describe('性别'),
  email: z.string().describe('邮箱'),
  phoneNumber: z.string().nullable().describe('手机号码'),
  status: userStatusSchema.describe('账号状态'),
  isLocked: z.boolean().describe('是否锁定'),
  lockExpireAt: z.string().nullable().describe('锁定到期时间（ISO 8601）'),
  roles: z.array(userRolePreviewSchema).describe('已绑定角色'),
  organizations: z.array(userOrganizationMembershipSchema).describe('在职组织归属'),
  mfaEnabled: z.boolean().describe('是否启用 MFA'),
  mfaType: userMfaTypeSchema.describe('MFA 类型'),
  mustChangePassword: z.boolean().describe('下次登录是否必须改密'),
  lastPasswordChange: z.string().nullable().describe('上次改密时间（ISO 8601）'),
  loginAttempts: z.number().int().describe('登录失败次数'),
  lastLoginAt: z.string().nullable().describe('最近登录时间（ISO 8601）'),
  lastLoginIp: z.string().nullable().describe('最近登录 IP'),
  lastActiveAt: z.string().nullable().describe('最近活跃时间（ISO 8601）'),
  remark: z.string().nullable().describe('备注'),
  createdAt: z.string().describe('创建时间（ISO 8601）'),
  updatedAt: z.string().describe('更新时间（ISO 8601）')
})

export const createUserSchema = z.object({
  username: usernameSchema,
  email: z.email('无效的邮箱格式').describe('邮箱'),
  password: userPasswordSchema,
  nickname: nicknameSchema.optional().describe('昵称'),
  realName: realNameSchema.optional().describe('真实姓名'),
  phoneNumber: phoneNumberSchema.optional().describe('手机号码'),
  gender: userGenderSchema.optional().describe('性别'),
  remark: remarkSchema.optional().describe('备注'),
  roleIds: z
    .array(z.string().trim().min(1, '角色 ID 不能为空'))
    .optional()
    .describe('初始角色 ID 列表；省略时分配默认 user 角色'),
  organizations: z
    .array(userOrganizationInputSchema)
    .optional()
    .describe('初始组织归属；省略时不绑定组织')
})

export const updateUserSchema = z
  .object({
    email: z.email('无效的邮箱格式').optional().describe('邮箱'),
    nickname: nicknameSchema.nullable().optional().describe('昵称'),
    realName: realNameSchema.nullable().optional().describe('真实姓名'),
    phoneNumber: phoneNumberSchema.nullable().optional().describe('手机号码'),
    gender: userGenderSchema.optional().describe('性别'),
    remark: remarkSchema.nullable().optional().describe('备注'),
    avatar: z.string().trim().max(500).nullable().optional().describe('头像 URL')
  })
  .strict()

export const adminResetPasswordSchema = z.object({
  password: userPasswordSchema,
  mustChangePassword: z.boolean().optional().describe('下次登录是否必须修改密码')
})

export const deleteUsersSchema = z.object({
  ids: z
    .array(z.string().trim().min(1, '用户 ID 不能为空'))
    .min(1, '至少需要一个用户 ID')
    .describe('要删除的用户 ID 列表')
})

export const updateUsersStatusSchema = z.object({
  ids: z
    .array(z.string().trim().min(1, '用户 ID 不能为空'))
    .min(1, '至少需要一个用户 ID')
    .describe('要更新状态的用户 ID 列表'),
  status: userStatusSchema.describe(
    '目标状态。用户要求禁用、停用、封禁、冻结账户时必须使用 suspended；inactive 只表示账号未完成激活流程'
  )
})

/** 覆盖式分配用户角色 */
export const assignUserRolesSchema = z.object({
  roleIds: z
    .array(z.string().trim().min(1, '角色 ID 不能为空'))
    .min(1, '至少需要一个角色')
    .describe('角色 ID 列表（覆盖式）')
})

/** 覆盖式同步用户组织归属 */
export const replaceUserOrganizationsSchema = z.object({
  organizations: z.array(userOrganizationInputSchema).describe('组织归属列表（覆盖当前在职记录）')
})

/** 更新基本资料后的局部响应 */
export const updateUserResultSchema = userSchema.pick({
  id: true,
  nickname: true,
  realName: true,
  avatar: true,
  gender: true,
  email: true,
  phoneNumber: true,
  remark: true,
  updatedAt: true
})

/** 分配角色后的局部响应 */
export const assignUserRolesResultSchema = userSchema.pick({
  id: true,
  roles: true
})

/** 同步组织归属后的局部响应 */
export const replaceUserOrganizationsResultSchema = userSchema.pick({
  id: true,
  organizations: true
})

export const usersSortBySchema = z.enum(['username', 'email', 'createdAt', 'lastLoginAt'])
export const usersSortOrderSchema = z.enum(['asc', 'desc'])

export const usersQuerySchema = pageQuerySchema.extend({
  keyword: z
    .string()
    .trim()
    .optional()
    .describe('关键字搜索：支持邮箱、用户名、昵称、真实姓名、手机号'),
  status: z
    .union([userStatusSchema, userStatusSchema.array()])
    .optional()
    .describe('状态,支持单个或多个,如: `active` 或者 [`active`, `inactive`]'),
  role: z
    .union([z.string(), z.string().array()])
    .optional()
    .describe('角色编码,支持单个或多个,例如: `admin` 或者 [`admin`, `guest`]'),
  organizationId: z.string().trim().min(1).optional().describe('按在职组织筛选'),
  sortBy: usersSortBySchema.optional().describe('排序字段'),
  sortOrder: usersSortOrderSchema.optional().describe('排序方向')
})

export const usersPageSchema = paged(userSchema)

export function getUserDisplayName(user: {
  realName?: string | null
  nickname?: string | null
  username: string
}): string {
  return user.realName || user.nickname || user.username
}

export function getPrimaryOrganization<T extends { isPrimary: boolean }>(
  organizations: T[] | null | undefined
): T | null {
  if (!organizations || organizations.length === 0) return null
  return organizations.find((item) => item.isPrimary) ?? organizations[0] ?? null
}
