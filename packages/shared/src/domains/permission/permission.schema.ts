import { z } from 'zod'

export const permissionCatalogStatusSchema = z
  .enum(['active', 'deprecated'])
  .describe('权限目录状态：active=可用（分配权限时只能用这个）；deprecated=已下线，禁止再分配')

export const permissionSchema = z.object({
  id: z.string().describe('权限 ID'),
  code: z.string().describe('权限编码'),
  name: z.string().describe('权限名称'),
  module: z.string().nullable().describe('所属模块'),
  resource: z.string().nullable().describe('资源'),
  action: z.string().nullable().describe('动作'),
  description: z.string().nullable().describe('描述'),
  status: permissionCatalogStatusSchema.default('active'),
  source: z.string().nullable().describe('来源：kernel 或 plugin:<id>')
})

export const permissionGroupSchema = z.object({
  module: z.string().describe('模块名称'),
  permissions: z.array(permissionSchema).describe('模块下的权限列表')
})

/** 字段权限策略（本期仅预留类型，业务未启用） */
export const fieldAccessSchema = z
  .enum(['none', 'masked', 'read', 'write'])
  .describe('字段访问级别：none=隐藏；masked=脱敏；read=只读；write=可写')

export const roleFieldPolicySchema = z.object({
  resource: z.string().min(1).describe('资源标识，如 user'),
  fieldKey: z.string().min(1).describe('字段键，如 phoneNumber'),
  access: fieldAccessSchema
})

export type Permission = z.infer<typeof permissionSchema>
export type PermissionGroup = z.infer<typeof permissionGroupSchema>
export type FieldAccess = z.infer<typeof fieldAccessSchema>
export type RoleFieldPolicy = z.infer<typeof roleFieldPolicySchema>
