import { z } from 'zod'

import { paged, pageQuerySchema } from './pagination'
import { userStatusSchema } from './users'

export const roleDataScopeSchema = z.union([
  z.literal('all').describe('全部数据权限'),
  z.literal('department').describe('本部门及以下'),
  z.literal('self').describe('仅本人数据'),
  z.literal('custom').describe('自定义数据范围')
])

export const rolesQuerySchema = pageQuerySchema.extend({
  keyword: z.string().trim().optional().describe('关键字搜索：支持角色名称和角色编码'),
  status: z
    .union([userStatusSchema, userStatusSchema.array()])
    .optional()
    .describe('状态,支持单个或多个'),
  dataScope: z
    .union([roleDataScopeSchema, roleDataScopeSchema.array()])
    .optional()
    .describe('数据范围,支持单个或多个')
})

export const roleSchema = z.object({
  id: z.string().describe('角色ID'),
  name: z.string().describe('角色名称'),
  code: z.string().describe('角色编码'),
  status: userStatusSchema.describe('状态'),
  dataScope: roleDataScopeSchema.describe('数据范围'),
  sort: z.number().int().describe('排序值'),
  description: z.string().nullable().describe('角色描述'),
  memberCount: z.number().int().nonnegative().describe('角色成员数'),
  permissions: z.array(z.string()).describe('权限标识集合'),
  createdAt: z.string().describe('创建时间（ISO 8601）'),
  updatedAt: z.string().describe('更新时间（ISO 8601）')
})

export const rolesPageSchema = paged(roleSchema)
