import { z } from 'zod'

import { paged, pageQuerySchema } from '../pagination'

export const roleStatusSchema = z.union([
  z.literal('active').describe('启用'),
  z.literal('disabled').describe('禁用')
])

export const roleDataScopeSchema = z.union([
  z.literal('all').describe('全部数据'),
  z.literal('department').describe('本部门及以下'),
  z.literal('self').describe('仅本人'),
  z.literal('custom').describe('自定义')
])

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
  dataScope: roleDataScopeSchema.default('self').describe('数据权限范围'),
  customOrgIds: z
    .array(z.string().trim().min(1))
    .optional()
    .describe('CUSTOM 数据范围时的组织 ID 白名单'),
  sort: z.number().int().min(0).max(9999).optional().describe('排序值，越小越靠前'),
  permissionCodes: z.array(z.string().trim().min(1)).optional().describe('权限编码列表')
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
  .omit({ code: true })
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
  permissionCodes: z.array(z.string().trim().min(1)).describe('权限编码列表')
})

export const rolesQuerySchema = pageQuerySchema.extend({
  keyword: z.string().trim().optional().describe('关键字搜索：支持角色名称、编码'),
  status: z
    .union([roleStatusSchema, roleStatusSchema.array()])
    .optional()
    .describe('状态，支持单个或多个'),
  dataScope: z
    .union([roleDataScopeSchema, roleDataScopeSchema.array()])
    .optional()
    .describe('数据范围，支持单个或多个')
})

export const roleSchema = z.object({
  id: z.string().describe('角色 ID'),
  code: z.string().describe('角色编码'),
  name: z.string().describe('角色名称'),
  status: roleStatusSchema.describe('状态'),
  dataScope: roleDataScopeSchema.describe('数据范围'),
  customOrgIds: z.array(z.string()).describe('CUSTOM 数据范围组织白名单'),
  sort: z.number().describe('排序值'),
  description: z.string().nullable().describe('描述'),
  memberCount: z.number().describe('成员数量'),
  permissions: z.array(z.string()).describe('权限编码列表'),
  isSystem: z.boolean().describe('是否系统内置角色'),
  createdAt: z.string().describe('创建时间（ISO 8601）'),
  updatedAt: z.string().describe('更新时间（ISO 8601）')
})

export const rolesPageSchema = paged(roleSchema)
