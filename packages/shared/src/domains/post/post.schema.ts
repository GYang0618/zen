import { z } from 'zod'

import { paged, pageQuerySchema } from '../pagination'

const idSchema = z.string().trim().min(1)
const dateTimeSchema = z.iso.datetime()

/** 组织岗位卡片中最近入职成员的头像预览上限 */
export const POSITION_MEMBER_PREVIEW_LIMIT = 3

export const jobProfileLevelSchema = z.enum(['P5', 'P6', 'P7', 'P8'])
export const jobProfileStatusSchema = z.enum(['active', 'disabled'])
export const organizationPositionStatusSchema = z.enum(['active', 'frozen'])

export const JOB_PROFILE_ICON_VALUES = [
  'briefcase-business',
  'code-2',
  'palette',
  'chart-no-axes-combined',
  'megaphone',
  'badge-dollar-sign',
  'headset',
  'users',
  'scale',
  'calculator',
  'stethoscope',
  'graduation-cap',
  'wrench',
  'factory',
  'truck',
  'shopping-cart',
  'building-2',
  'shield-check',
  'flask-conical',
  'clipboard-check',
  'chef-hat',
  'plane',
  'leaf',
  'hard-hat'
] as const

export const JOB_PROFILE_ICON_COLOR_VALUES = [
  'slate',
  'sky',
  'teal',
  'emerald',
  'amber',
  'orange',
  'rose',
  'indigo'
] as const

export const jobProfileIconSchema = z.enum(JOB_PROFILE_ICON_VALUES)
export const jobProfileIconColorSchema = z.enum(JOB_PROFILE_ICON_COLOR_VALUES)

export const jobProfileCodeSchema = z
  .string()
  .trim()
  .regex(/^POS-\d{4}$/, '岗位编码格式应为 POS-0001')

export const createJobProfileSchema = z
  .object({
    code: jobProfileCodeSchema,
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    level: jobProfileLevelSchema,
    family: z.string().trim().max(50).optional(),
    icon: jobProfileIconSchema.nullable().optional(),
    iconColor: jobProfileIconColorSchema.nullable().optional(),
    status: jobProfileStatusSchema.optional().default('active')
  })
  .strict()

export const updateJobProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    level: jobProfileLevelSchema.optional(),
    family: z.string().trim().max(50).nullable().optional(),
    icon: jobProfileIconSchema.nullable().optional(),
    iconColor: jobProfileIconColorSchema.nullable().optional(),
    status: jobProfileStatusSchema.optional()
  })
  .strict()

export const findJobProfilesQuerySchema = pageQuerySchema
  .extend({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().trim().optional(),
    status: jobProfileStatusSchema.optional(),
    level: jobProfileLevelSchema.optional()
  })
  .strict()

export const jobProfileOrganizationLinkSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationCode: z.string(),
  headcount: z.number().int().min(0),
  activeCount: z.number().int().min(0),
  status: organizationPositionStatusSchema,
  level: z.string()
})

export const positionMemberPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable()
})

export const jobProfileSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.string(),
  family: z.string().nullable(),
  icon: jobProfileIconSchema.nullable(),
  iconColor: jobProfileIconColorSchema.nullable(),
  status: jobProfileStatusSchema,
  organizationCount: z.number().int().min(0),
  totalHeadcount: z.number().int().min(0),
  activeCount: z.number().int().min(0),
  memberPreview: z
    .array(positionMemberPreviewSchema)
    .max(POSITION_MEMBER_PREVIEW_LIMIT)
    .describe(`最近添加的在岗人员，最多 ${POSITION_MEMBER_PREVIEW_LIMIT} 人`),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

export const jobProfileDetailSchema = jobProfileSchema.extend({
  organizations: z.array(jobProfileOrganizationLinkSchema)
})

/** 将岗位目录关联到组织并设置编制 */
export const linkOrganizationPositionSchema = z
  .object({
    jobProfileId: idSchema.describe(
      '岗位目录 ID，来自 query_job_profiles_list（须为启用且尚未挂到该组织）'
    ),
    headcount: z.number().int().min(1).max(999),
    level: jobProfileLevelSchema.optional(),
    description: z.string().trim().max(500).optional()
  })
  .strict()

/** @deprecated 使用 linkOrganizationPositionSchema；保留别名兼容旧导入 */
export const createPositionSchema = linkOrganizationPositionSchema

export const updateOrganizationPositionSchema = z
  .object({
    headcount: z.number().int().min(1).max(999).optional(),
    level: jobProfileLevelSchema.nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    status: organizationPositionStatusSchema.optional()
  })
  .strict()

export const positionSchema = z.object({
  id: z.string(),
  jobProfileId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.string(),
  icon: jobProfileIconSchema.nullable(),
  iconColor: jobProfileIconColorSchema.nullable(),
  headcount: z.number(),
  activeCount: z.number(),
  memberPreview: z
    .array(positionMemberPreviewSchema)
    .max(POSITION_MEMBER_PREVIEW_LIMIT)
    .describe(`最近添加的在岗人员，最多 ${POSITION_MEMBER_PREVIEW_LIMIT} 人`),
  status: organizationPositionStatusSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
})

export type JobProfileLevel = z.infer<typeof jobProfileLevelSchema>
export type JobProfileStatus = z.infer<typeof jobProfileStatusSchema>
export type JobProfileIcon = z.infer<typeof jobProfileIconSchema>
export type JobProfileIconColor = z.infer<typeof jobProfileIconColorSchema>
export type OrganizationPositionStatus = z.infer<typeof organizationPositionStatusSchema>
export type CreateJobProfile = z.infer<typeof createJobProfileSchema>
export type UpdateJobProfile = z.infer<typeof updateJobProfileSchema>
export type FindJobProfilesQuery = z.infer<typeof findJobProfilesQuerySchema>
export type JobProfile = z.infer<typeof jobProfileSchema>
export type JobProfileDetail = z.infer<typeof jobProfileDetailSchema>
export type JobProfileOrganizationLink = z.infer<typeof jobProfileOrganizationLinkSchema>
export type LinkOrganizationPosition = z.infer<typeof linkOrganizationPositionSchema>
/** @deprecated 使用 LinkOrganizationPosition */
export type CreatePosition = LinkOrganizationPosition
export type UpdateOrganizationPosition = z.infer<typeof updateOrganizationPositionSchema>
export type PositionMemberPreview = z.infer<typeof positionMemberPreviewSchema>
export type Position = z.infer<typeof positionSchema>

export const jobProfilesPageSchema = paged(jobProfileSchema)
export type JobProfilesPage = z.infer<typeof jobProfilesPageSchema>
