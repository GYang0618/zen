import { z } from 'zod'

export const permissionSchema = z.object({
  id: z.string().describe('权限 ID'),
  code: z.string().describe('权限编码'),
  name: z.string().describe('权限名称'),
  module: z.string().nullable().describe('所属模块'),
  description: z.string().nullable().describe('描述')
})

export const permissionGroupSchema = z.object({
  module: z.string().describe('模块名称'),
  permissions: z.array(permissionSchema).describe('模块下的权限列表')
})
