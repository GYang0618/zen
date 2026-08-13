import { z } from 'zod'

export const permissionCatalogStatusSchema = z.union([
  z.literal('active').describe('可用'),
  z.literal('deprecated').describe('已下线')
])

export const permissionSchema = z.object({
  id: z.string().describe('权限 ID'),
  code: z.string().describe('权限编码'),
  name: z.string().describe('权限名称'),
  module: z.string().nullable().describe('所属模块'),
  resource: z.string().nullable().describe('资源'),
  action: z.string().nullable().describe('动作'),
  description: z.string().nullable().describe('描述'),
  status: permissionCatalogStatusSchema.default('active').describe('目录状态'),
  source: z.string().nullable().describe('来源：kernel 或 plugin:<id>')
})

export const permissionGroupSchema = z.object({
  module: z.string().describe('模块名称'),
  permissions: z.array(permissionSchema).describe('模块下的权限列表')
})

/** 字段权限策略（本期仅预留类型，业务未启用） */
export const fieldAccessSchema = z.union([
  z.literal('none').describe('隐藏'),
  z.literal('masked').describe('脱敏'),
  z.literal('read').describe('只读'),
  z.literal('write').describe('可写')
])

export const roleFieldPolicySchema = z.object({
  resource: z.string().min(1).describe('资源标识，如 user'),
  fieldKey: z.string().min(1).describe('字段键，如 phoneNumber'),
  access: fieldAccessSchema.describe('访问级别')
})

export type Permission = z.infer<typeof permissionSchema>
export type PermissionGroup = z.infer<typeof permissionGroupSchema>
export type FieldAccess = z.infer<typeof fieldAccessSchema>
export type RoleFieldPolicy = z.infer<typeof roleFieldPolicySchema>
