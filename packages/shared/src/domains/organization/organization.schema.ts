import { z } from 'zod'

import { auditDiffSchema } from '../audit/audit-diff.schema'
import { paged, pageQuerySchema } from '../pagination'
import { ORGANIZATION_TYPE_TEMPLATE_IDS, REQUIRED_ORGANIZATION_TYPES } from './organization.catalog'
import {
  canBeRootOrganization,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_VALUES,
  ROOT_ORGANIZATION_TYPES
} from './organization.hierarchy'

const idSchema = z.string().trim().min(1)
const dateSchema = z.iso.date()
const dateTimeSchema = z.iso.datetime()

export const organizationTypeSchema = z.enum(ORGANIZATION_TYPE_VALUES)

export const rootOrganizationTypeSchema = z.enum(ROOT_ORGANIZATION_TYPES)

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
    type: organizationTypeSchema.describe('组织类型，必须是本企业已启用的类型'),
    parentId: idSchema.nullable().default(null),
    leaderId: idSchema.nullable().optional(),
    effectiveDate: dateSchema,
    description: z.string().trim().max(500).optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.parentId == null && !canBeRootOrganization(data.type)) {
      ctx.addIssue({
        code: 'custom',
        path: ['type'],
        message: '该组织类型不能作为根组织'
      })
    }
  })

export const updateOrganizationSchema = z
  .object({
    name: organizationNameSchema.optional(),
    type: organizationTypeSchema.optional().describe('组织类型，必须是本企业已启用的类型'),
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

export {
  createPositionSchema,
  linkOrganizationPositionSchema,
  positionSchema,
  updateOrganizationPositionSchema
} from '../post/post.schema'

export type {
  CreatePosition,
  LinkOrganizationPosition,
  Position,
  UpdateOrganizationPosition
} from '../post/post.schema'

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
export type OrganizationLeader = z.infer<typeof organizationLeaderSchema>
export type CreateOrganization = z.infer<typeof createOrganizationSchema>
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>
export type UpdateOrganizationLeader = z.infer<typeof updateOrganizationLeaderSchema>
export type ChangeOrganizationParent = z.infer<typeof changeOrganizationParentSchema>
export type AddOrganizationMember = z.infer<typeof addOrganizationMemberSchema>
export type OrganizationMember = z.infer<typeof organizationMemberSchema>
export type OrganizationActivity = z.infer<typeof organizationActivitySchema>
export type OrganizationActivitiesQuery = z.infer<typeof organizationActivitiesQuerySchema>
export type Organization = z.infer<typeof organizationSchema>
export type OrganizationTreeNode = Organization & { children: OrganizationTreeNode[] }

export const organizationTreeNodeSchema: z.ZodType<OrganizationTreeNode> = z.lazy(() =>
  organizationSchema.extend({ children: z.array(organizationTreeNodeSchema) })
)

export const organizationTreeSchema = z.array(organizationTreeNodeSchema)
export const organizationActivitiesPageSchema = paged(organizationActivitySchema)

export const organizationTypeCatalogItemSchema = z.object({
  type: organizationTypeSchema,
  label: z.string().trim().min(1).max(20),
  enabled: z.boolean(),
  required: z.boolean(),
  canBeRoot: z.boolean()
})

export const organizationTypeCatalogSchema = z.object({
  templateId: z.union([z.enum(ORGANIZATION_TYPE_TEMPLATE_IDS), z.literal('custom')]),
  items: z.array(organizationTypeCatalogItemSchema)
})

export const organizationTypeCatalogResponseSchema = z.object({
  catalog: organizationTypeCatalogSchema,
  inUseTypes: z.array(organizationTypeSchema)
})

export const updateOrganizationTypeCatalogSchema = z
  .object({
    items: z.array(
      z.object({
        type: organizationTypeSchema,
        enabled: z.boolean(),
        label: z.string().trim().min(1, '类型名称不能为空').max(20, '类型名称不能超过20个字符')
      })
    )
  })
  .strict()
  .superRefine((data, ctx) => {
    const seen = new Set<string>()
    for (const item of data.items) {
      if (seen.has(item.type)) {
        ctx.addIssue({ code: 'custom', path: ['items'], message: '组织类型不能重复' })
        return
      }
      seen.add(item.type)
    }
    for (const type of ORGANIZATION_TYPE_VALUES) {
      if (!seen.has(type)) {
        ctx.addIssue({ code: 'custom', path: ['items'], message: '必须包含全部组织类型' })
        return
      }
    }
    for (const type of REQUIRED_ORGANIZATION_TYPES) {
      const item = data.items.find((entry) => entry.type === type)
      if (item && !item.enabled) {
        ctx.addIssue({
          code: 'custom',
          path: ['items'],
          message: `${ORGANIZATION_TYPE_LABELS[type]}为必选类型，不能关闭`
        })
      }
    }
  })

export const applyOrganizationTypeTemplateSchema = z
  .object({
    templateId: z.enum(ORGANIZATION_TYPE_TEMPLATE_IDS)
  })
  .strict()

export const organizationFocusSchema = z.object({
  id: idSchema.optional(),
  keyword: z.string().trim().optional()
})

export type OrganizationFocus = z.input<typeof organizationFocusSchema>
export type OrganizationTypeCatalogResponse = z.infer<typeof organizationTypeCatalogResponseSchema>
export type UpdateOrganizationTypeCatalog = z.infer<typeof updateOrganizationTypeCatalogSchema>
export type ApplyOrganizationTypeTemplate = z.infer<typeof applyOrganizationTypeTemplateSchema>
