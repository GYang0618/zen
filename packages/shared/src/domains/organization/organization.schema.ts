import { z } from 'zod'

import { auditDiffSchema } from '../audit/audit-diff.schema'
import { paged, pageQuerySchema } from '../pagination'

const idSchema = z.string().trim().min(1)
const dateSchema = z.iso.date()
const dateTimeSchema = z.iso.datetime()

export const organizationTypeSchema = z.enum([
  'group',
  'company',
  'branch',
  'center',
  'department',
  'team'
])

export const rootOrganizationTypeSchema = z.enum(['group', 'company', 'center'])

const organizationCodeSchema = z
  .string()
  .trim()
  .min(2, '组织编码至少需要2个字符')
  .max(50, '组织编码不能超过50个字符')
  .regex(/^[a-z][a-z0-9_]*$/, '组织编码仅支持小写字母、数字和下划线，且以字母开头')

const organizationNameSchema = z.string().trim().min(1, '组织名称不能为空').max(100)

export const organizationLeaderSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  avatar: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable()
})

export const createOrganizationSchema = z
  .object({
    code: organizationCodeSchema.describe('组织编码，创建后不可修改'),
    name: organizationNameSchema,
    type: organizationTypeSchema,
    parentId: idSchema.nullable().default(null),
    leaderId: idSchema.nullable().optional(),
    effectiveDate: dateSchema,
    description: z.string().trim().max(500).optional()
  })
  .strict()

export const updateOrganizationSchema = z
  .object({
    name: organizationNameSchema.optional(),
    type: organizationTypeSchema.optional(),
    effectiveDate: dateSchema.optional(),
    description: z.string().trim().max(500).nullable().optional()
  })
  .strict()

export const updateOrganizationLeaderSchema = z
  .object({
    leaderId: idSchema.nullable()
  })
  .strict()

/** 拖拽仅变更父级，不接受任何排序位置。 */
export const changeOrganizationParentSchema = z
  .object({
    parentId: idSchema.nullable()
  })
  .strict()

export const addOrganizationMemberSchema = z
  .object({
    userIds: z.array(idSchema).min(1, '至少选择一名用户').describe('要加入组织的用户 ID 列表')
  })
  .strict()

export const createPositionSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^POS-\d{4}$/, '岗位编码格式应为 POS-0001'),
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    level: z.enum(['P5', 'P6', 'P7', 'P8']),
    headcount: z.number().int().min(1).max(999)
  })
  .strict()

export const organizationMemberSchema = z.object({
  id: z.string(),
  avatar: z.string().nullable(),
  username: z.string(),
  nickname: z.string().nullable(),
  post: z.string().nullable(),
  organization: z.string(),
  accountStatus: z.enum(['active', 'inactive', 'pending', 'suspended']),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  level: z.string().nullable()
})

export const positionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.string(),
  headcount: z.number(),
  activeCount: z.number(),
  createdAt: dateTimeSchema
})

export const organizationActivitySchema = z.object({
  id: z.string(),
  actor: z.object({
    id: z.string().nullable(),
    name: z.string(),
    avatar: z.string().nullable()
  }),
  action: z.string(),
  title: z.string().describe('操作标题，如「添加了成员」'),
  description: z.string().describe('变更详情，由 AuditDiff 生成'),
  diff: auditDiffSchema.nullable().describe('结构化变更，历史脏数据可能为 null'),
  createdAt: dateTimeSchema
})

export const organizationActivitiesQuerySchema = pageQuerySchema
  .extend({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict()

export const organizationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: organizationTypeSchema,
  parentId: z.string().nullable(),
  description: z.string().nullable(),
  effectiveDate: dateSchema,
  leader: organizationLeaderSchema.nullable(),
  memberCount: z.number().int().min(0),
  positionCount: z.number().int().min(0),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

export type OrganizationType = z.infer<typeof organizationTypeSchema>
export type RootOrganizationType = z.infer<typeof rootOrganizationTypeSchema>
export type CreateOrganization = z.infer<typeof createOrganizationSchema>
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>
export type UpdateOrganizationLeader = z.infer<typeof updateOrganizationLeaderSchema>
export type ChangeOrganizationParent = z.infer<typeof changeOrganizationParentSchema>
export type AddOrganizationMember = z.infer<typeof addOrganizationMemberSchema>
export type CreatePosition = z.infer<typeof createPositionSchema>
export type OrganizationMember = z.infer<typeof organizationMemberSchema>
export type Position = z.infer<typeof positionSchema>
export type OrganizationActivity = z.infer<typeof organizationActivitySchema>
export type OrganizationActivitiesQuery = z.infer<typeof organizationActivitiesQuerySchema>
export type Organization = z.infer<typeof organizationSchema>
export type OrganizationTreeNode = Organization & { children: OrganizationTreeNode[] }

export const organizationTreeNodeSchema: z.ZodType<OrganizationTreeNode> = z.lazy(() =>
  organizationSchema.extend({ children: z.array(organizationTreeNodeSchema) })
)

export const organizationTreeSchema = z.array(organizationTreeNodeSchema)
export const organizationActivitiesPageSchema = paged(organizationActivitySchema)

export const organizationFocusSchema = z.object({
  id: idSchema.optional(),
  keyword: z.string().trim().optional()
})

export type OrganizationFocus = z.input<typeof organizationFocusSchema>
