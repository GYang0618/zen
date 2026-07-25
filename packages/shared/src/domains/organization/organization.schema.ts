import { z } from 'zod'

export const organizationTypeSchema = z.union([
  z.literal('company').describe('公司'),
  z.literal('branch').describe('分支机构'),
  z.literal('department').describe('部门'),
  z.literal('team').describe('小组')
])

export const organizationStatusSchema = z.union([
  z.literal('active').describe('启用'),
  z.literal('disabled').describe('禁用')
])

const organizationCodeSchema = z
  .string()
  .trim()
  .min(2, '组织编码至少需要2个字符')
  .max(50, '组织编码不能超过50个字符')
  .regex(/^[a-z][a-z0-9_]*$/, '组织编码仅支持小写字母、数字和下划线，且以字母开头')

export const createOrganizationSchema = z.object({
  code: organizationCodeSchema.describe('组织编码，创建后不可修改'),
  name: z
    .string()
    .trim()
    .min(1, '组织名称不能为空')
    .max(100, '组织名称不能超过100个字符')
    .describe('组织名称'),
  type: organizationTypeSchema.default('department').describe('组织类型'),
  parentId: z.string().trim().min(1).nullable().optional().describe('父组织 ID'),
  leaderId: z.string().trim().min(1).nullable().optional().describe('负责人用户 ID'),
  description: z.string().trim().max(500).optional().describe('描述'),
  sort: z.number().int().min(0).max(9999).optional().describe('排序值')
})

export const updateOrganizationSchema = createOrganizationSchema
  .omit({ code: true })
  .partial()
  .extend({
    status: organizationStatusSchema.optional().describe('状态')
  })

export const moveOrganizationSchema = z.object({
  parentId: z.string().trim().min(1).nullable().describe('新的父组织 ID，null 表示升为根节点')
})

export const deleteOrganizationsSchema = z.object({
  ids: z
    .array(z.string().trim().min(1))
    .min(1, '至少需要一个组织 ID')
    .describe('要删除的组织 ID 列表')
})

export const upsertOrganizationMemberSchema = z.object({
  userId: z.string().trim().min(1).describe('用户 ID'),
  isPrimary: z.boolean().optional().default(false).describe('是否主职'),
  postId: z.string().trim().min(1).nullable().optional().describe('岗位 ID')
})

export const createPostSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, '岗位编码仅支持小写字母、数字和下划线'),
  name: z.string().trim().min(1).max(100),
  organizationId: z.string().trim().min(1),
  description: z.string().trim().max(500).optional(),
  grade: z.string().trim().max(50).optional(),
  headcount: z.number().int().min(1).max(999).optional().default(1),
  sort: z.number().int().min(0).max(9999).optional()
})

export const updatePostSchema = createPostSchema
  .omit({ code: true, organizationId: true })
  .partial()
  .extend({
    status: organizationStatusSchema.optional()
  })

export type UpsertOrganizationMember = z.infer<typeof upsertOrganizationMemberSchema>
export type CreatePost = z.infer<typeof createPostSchema>
export type UpdatePost = z.infer<typeof updatePostSchema>

export const postSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  organizationId: z.string(),
  description: z.string().nullable(),
  grade: z.string().nullable(),
  headcount: z.number(),
  filledCount: z.number(),
  status: organizationStatusSchema,
  sort: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export type Post = z.infer<typeof postSchema>

export const organizationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: organizationTypeSchema,
  parentId: z.string().nullable(),
  leaderId: z.string().nullable(),
  leaderName: z.string().nullable(),
  description: z.string().nullable(),
  status: organizationStatusSchema,
  sort: z.number(),
  path: z.string().nullable(),
  level: z.number(),
  memberCount: z.number(),
  childrenCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export type OrganizationType = z.infer<typeof organizationTypeSchema>
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>
export type CreateOrganization = z.infer<typeof createOrganizationSchema>
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>
export type MoveOrganization = z.infer<typeof moveOrganizationSchema>
export type DeleteOrganizations = z.infer<typeof deleteOrganizationsSchema>
export type Organization = z.infer<typeof organizationSchema>
export type OrganizationTreeNode = Organization & { children: OrganizationTreeNode[] }

/** 组织树节点（含递归 children），用于 API 结果校验与生成式 UI 解析 */
export const organizationTreeNodeSchema: z.ZodType<OrganizationTreeNode> = z.lazy(() =>
  organizationSchema.extend({
    children: z.array(organizationTreeNodeSchema)
  })
)

export const organizationTreeSchema = z.array(organizationTreeNodeSchema)

/** 前端定位组织树节点（打开页面并选中 / 关键字过滤） */
export const organizationFocusSchema = z.object({
  id: z.string().trim().min(1).optional().describe('要选中的组织 ID'),
  keyword: z.string().trim().optional().describe('按组织名称或编码过滤树节点')
})

export type OrganizationFocus = z.input<typeof organizationFocusSchema>
