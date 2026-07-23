import { z } from 'zod'

import { paged, pageQuerySchema } from '../pagination'

export const userStatusSchema = z.union([
  z.literal('active').describe('激活，账号正常可用'),
  z.literal('inactive').describe('未激活，仅用于账号尚未完成激活流程，不表示管理员禁用'),
  z.literal('pending').describe('待审核，账号等待审批'),
  z.literal('suspended').describe('已停用/已禁用/已封禁，用于管理员禁用账户')
])

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
  phoneNumber: z.string().max(20, '手机号码不能超过20个字符').describe('手机号码').optional()
})

export const updateUserSchema = createUserSchema.partial()

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
  organizations: z
    .array(
      z.object({
        organizationId: z.string().trim().min(1, '组织 ID 不能为空').describe('组织 ID'),
        isPrimary: z.boolean().optional().describe('是否主职'),
        postId: z.string().trim().min(1).nullable().optional().describe('岗位 ID')
      })
    )
    .describe('组织归属列表（覆盖当前在职记录）')
})

export const usersSortBySchema = z.enum(['username', 'email', 'jobTitle', 'createdAt'])
export const usersSortOrderSchema = z.enum(['asc', 'desc'])

export const usersQuerySchema = pageQuerySchema.extend({
  keyword: z.string().trim().optional().describe('关键字搜索：支持邮箱、用户名、昵称、手机号'),
  status: z
    .union([userStatusSchema, userStatusSchema.array()])
    .optional()
    .describe('状态,支持单个或多个,如: `active` 或者 [`active`, `inactive`]'),
  role: z
    .union([z.string(), z.string().array()])
    .optional()
    .describe('角色,支持单个或多个,例如: `admin` 或者 [`admin`, `guest`]'),
  sortBy: usersSortBySchema.optional().describe('排序字段'),
  sortOrder: usersSortOrderSchema.optional().describe('排序方向')
})

/**
 * 与 `GET /user` 列表行及 `toUserListItemResponse` 对齐
 */
export const userSchema = z.object({
  id: z.string().describe('用户ID'),
  username: z.string().describe('用户名'),
  nickname: z.string().nullable().describe('昵称'),
  realName: z.string().nullable().describe('真实姓名'),
  avatar: z.string().nullable().describe('头像'),
  email: z.string().describe('邮箱'),
  phoneNumber: z.string().nullable().describe('手机号码'),
  status: userStatusSchema.describe('状态'),
  role: z.string().nullable().describe('主角色 code'),
  deptName: z.string().nullable().describe('部门'),
  jobTitle: z.string().nullable().describe('职位'),
  permissions: z.array(z.string()).describe('权限'),
  isLocked: z.boolean().optional().describe('是否锁定'),
  createdAt: z.string().describe('创建时间（ISO 8601）'),
  updatedAt: z.string().describe('更新时间（ISO 8601）')
})

export const usersPageSchema = paged(userSchema)
