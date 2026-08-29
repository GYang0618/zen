import { z } from 'zod'

import { paged, pageQuerySchema } from '../pagination'

/** 角色卡片 / 详情侧栏成员头像预览上限（按最近添加） */
export const ROLE_MEMBER_PREVIEW_LIMIT = 5

export const ROLE_ICON_VALUES = [
  'crown',
  'shield',
  'shield-check',
  'shield-user',
  'user-shield',
  'lock',
  'key-round',
  'fingerprint',
  'badge-check',
  'users',
  'user-round',
  'user-cog',
  'user-check',
  'id-card',
  'briefcase',
  'building-2',
  'settings',
  'eye',
  'database',
  'server',
  'clipboard-check',
  'gavel',
  'scale',
  'hard-hat',
  'wrench',
  'headphones',
  'wallet',
  'book-user',
  'star',
  'contact'
] as const

export const ROLE_ICON_COLOR_VALUES = [
  'slate',
  'sky',
  'teal',
  'emerald',
  'amber',
  'orange',
  'rose',
  'indigo'
] as const

export const roleStatusSchema = z.union([
  z.literal('active').describe('启用'),
  z.literal('disabled').describe('禁用')
])

/** 展示用派生状态：locked/expired 由 kind / expiresAt 计算 */
export const roleEffectiveStatusSchema = z.union([
  z.literal('active').describe('激活'),
  z.literal('disabled').describe('冻结'),
  z.literal('expired').describe('过期'),
  z.literal('locked').describe('锁定')
])

export const roleKindSchema = z.union([
  z.literal('system').describe('系统角色'),
  z.literal('custom').describe('自定义角色')
])

export const roleDataScopeSchema = z.union([
  z.literal('all').describe('全部数据'),
  z.literal('org_and_child').describe('本组织及下级'),
  z.literal('org').describe('仅本组织'),
  z.literal('self').describe('仅本人数据'),
  z.literal('custom').describe('自定义组织白名单')
])

export const roleIconSchema = z.enum(ROLE_ICON_VALUES)
export const roleIconColorSchema = z.enum(ROLE_ICON_COLOR_VALUES)

const roleCodeSchema = z
  .string()
  .trim()
  .min(2, '角色编码至少需要2个字符')
  .max(50, '角色编码不能超过50个字符')
  .regex(/^[a-z][a-z0-9_]*$/, '角色编码仅支持小写字母、数字和下划线，且以字母开头')

const createRoleObjectSchema = z.object({
  code: roleCodeSchema.describe('角色编码，创建后不可修改'),
  name: z
    .string()
    .trim()
    .min(1, '角色名称不能为空')
    .max(50, '角色名称不能超过50个字符')
    .describe('角色名称'),
  description: z.string().trim().max(200, '描述不能超过200个字符').optional().describe('角色描述'),
  icon: roleIconSchema.nullable().optional().describe('角色图标'),
  iconColor: roleIconColorSchema.nullable().optional().describe('图标颜色'),
  expiresAt: z
    .union([z.string().datetime({ offset: true }), z.string().date()])
    .nullable()
    .optional()
    .describe('过期时间（ISO date 或 datetime），null 表示长期有效'),
  dataScope: roleDataScopeSchema.default('self').describe('数据权限范围'),
  customOrgIds: z
    .array(z.string().trim().min(1))
    .optional()
    .describe('CUSTOM 数据范围时的组织 ID 白名单'),
  sort: z.number().int().min(0).max(9999).optional().describe('排序值，越小越靠前'),
  permissionCodes: z
    .array(z.string().trim().min(1))
    .optional()
    .describe('权限编码列表（必须来自 query_permissions_list 的 active code）')
})

export const createRoleSchema = createRoleObjectSchema.superRefine((value, ctx) => {
  if (value.dataScope === 'custom' && (!value.customOrgIds || value.customOrgIds.length === 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['customOrgIds'],
      message: '自定义数据范围时至少选择一个组织'
    })
  }
})

export const updateRoleSchema = createRoleObjectSchema
  .omit({ code: true, permissionCodes: true })
  .partial()
  .extend({
    status: roleStatusSchema.optional().describe('角色状态')
  })
  .superRefine((value, ctx) => {
    if (
      value.dataScope === 'custom' &&
      value.customOrgIds !== undefined &&
      value.customOrgIds.length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['customOrgIds'],
        message: '自定义数据范围时至少选择一个组织'
      })
    }
  })

export const deleteRolesSchema = z.object({
  ids: z
    .array(z.string().trim().min(1, '角色 ID 不能为空'))
    .min(1, '至少需要一个角色 ID')
    .describe('要删除的角色 ID 列表')
})

export const assignRolePermissionsSchema = z.object({
  permissionCodes: z
    .array(z.string().trim().min(1))
    .describe('权限编码列表（必须来自 query_permissions_list 的 active code）'),
  /** 乐观锁：打开编辑时的 updatedAt */
  baseVersion: z.string().min(1).describe('并发基线版本（ISO 8601）')
})

export const assignRoleDataScopeSchema = z
  .object({
    dataScope: roleDataScopeSchema.describe('数据权限范围'),
    customOrgIds: z
      .array(z.string().trim().min(1))
      .optional()
      .describe('CUSTOM 数据范围时的组织 ID 白名单'),
    baseVersion: z.string().min(1).describe('并发基线版本（ISO 8601）')
  })
  .superRefine((value, ctx) => {
    if (value.dataScope === 'custom' && (!value.customOrgIds || value.customOrgIds.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['customOrgIds'],
        message: '自定义数据范围时至少选择一个组织'
      })
    }
  })

export const assignRoleMembersSchema = z.object({
  userIds: z
    .array(z.string().trim().min(1, '用户 ID 不能为空'))
    .min(1, '至少选择一名用户')
    .describe('要绑定到角色的用户 ID 列表')
})

export const cloneRoleSchema = z.object({
  code: roleCodeSchema.describe('新角色编码'),
  name: z
    .string()
    .trim()
    .min(1, '角色名称不能为空')
    .max(50, '角色名称不能超过50个字符')
    .describe('新角色名称'),
  description: z
    .string()
    .trim()
    .max(200, '描述不能超过200个字符')
    .optional()
    .describe('新角色描述'),
  expiresAt: z
    .union([z.string().datetime({ offset: true }), z.string().date()])
    .nullable()
    .optional()
    .describe('过期时间（ISO date 或 datetime），null 表示长期有效')
})

export const rolesQuerySchema = pageQuerySchema.extend({
  keyword: z.string().trim().optional().describe('关键字搜索：支持角色名称、编码'),
  status: z
    .union([roleStatusSchema, roleStatusSchema.array()])
    .optional()
    .describe('持久化状态，支持单个或多个'),
  effectiveStatus: z
    .union([roleEffectiveStatusSchema, roleEffectiveStatusSchema.array()])
    .optional()
    .describe('派生展示状态，支持单个或多个'),
  dataScope: z
    .union([roleDataScopeSchema, roleDataScopeSchema.array()])
    .optional()
    .describe('数据范围，支持单个或多个')
})

export const roleMemberPreviewSchema = z.object({
  id: z.string().describe('用户 ID'),
  nickname: z.string().nullable().describe('昵称'),
  avatar: z.string().nullable().describe('头像')
})

export const roleSchema = z.object({
  id: z.string().describe('角色 ID'),
  code: z.string().describe('角色编码'),
  name: z.string().describe('角色名称'),
  status: roleStatusSchema.describe('持久化状态'),
  effectiveStatus: roleEffectiveStatusSchema.describe('派生展示状态'),
  kind: roleKindSchema.describe('角色种类'),
  dataScope: roleDataScopeSchema.describe('数据范围'),
  customOrgIds: z.array(z.string()).describe('CUSTOM 数据范围组织白名单'),
  icon: roleIconSchema.nullable().describe('角色图标'),
  iconColor: roleIconColorSchema.nullable().describe('图标颜色'),
  expiresAt: z.string().nullable().describe('过期时间（ISO 8601），null 表示长期有效'),
  sort: z.number().describe('排序值'),
  description: z.string().nullable().describe('描述'),
  memberCount: z.number().describe('成员数量'),
  permissionCount: z.number().describe('权限数量'),
  memberPreview: z
    .array(roleMemberPreviewSchema)
    .describe(`成员头像预览（最近添加，最多 ${ROLE_MEMBER_PREVIEW_LIMIT} 人）`),
  permissions: z.array(z.string()).describe('权限编码列表'),
  isSystem: z.boolean().describe('是否系统内置角色（兼容字段，等同 kind=system）'),
  createdAt: z.string().describe('创建时间（ISO 8601）'),
  updatedAt: z.string().describe('更新时间（ISO 8601）')
})

export const roleMemberSchema = z.object({
  id: z.string().describe('用户 ID'),
  username: z.string().describe('用户名'),
  nickname: z.string().nullable().describe('昵称'),
  realName: z.string().nullable().describe('真实姓名'),
  avatar: z.string().nullable().describe('头像'),
  email: z.string().describe('邮箱'),
  deptName: z.string().nullable().describe('部门'),
  boundAt: z.string().describe('绑定时间（ISO 8601）')
})

export const rolesPageSchema = paged(roleSchema)
export const roleMembersPageSchema = paged(roleMemberSchema)

export function deriveRoleEffectiveStatus(input: {
  kind: 'system' | 'custom'
  status: 'active' | 'disabled'
  expiresAt: string | null | undefined
  now?: Date
}): z.infer<typeof roleEffectiveStatusSchema> {
  if (input.kind === 'system') return 'locked'
  if (input.expiresAt) {
    const expires = new Date(input.expiresAt)
    const now = input.now ?? new Date()
    if (!Number.isNaN(expires.getTime()) && expires.getTime() <= now.getTime()) {
      return 'expired'
    }
  }
  return input.status === 'disabled' ? 'disabled' : 'active'
}
