import { z } from 'zod'

import { paged, pageQuerySchema } from '../pagination/index.js'
import { FILE_CATEGORY_VALUES } from './file-category.js'

export const FILE_PURPOSE_VALUES = ['avatar', 'attachment', 'export', 'temp', 'legacy'] as const
export const filePurposeSchema = z.enum(FILE_PURPOSE_VALUES)
export type FilePurpose = z.infer<typeof filePurposeSchema>

export const fileCategorySchema = z.enum(FILE_CATEGORY_VALUES)

export const FILE_STATUS_VALUES = [
  'pending',
  'uploaded',
  'quarantined',
  'ready',
  'deleted',
  'purged'
] as const
export const fileStatusSchema = z.enum(FILE_STATUS_VALUES)
export type FileStatus = z.infer<typeof fileStatusSchema>

export const fileAssetSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  ownerId: z.string(),
  organizationId: z.string().nullable(),
  purpose: filePurposeSchema,
  category: fileCategorySchema,
  status: fileStatusSchema,
  originalName: z.string(),
  mimeType: z.string().nullable(),
  size: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable()
})
export type FileAsset = z.infer<typeof fileAssetSchema>

export const createUploadIntentSchema = z.object({
  purpose: filePurposeSchema.exclude(['legacy']),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  size: z
    .number()
    .int()
    .positive()
    .max(1024 * 1024 * 1024),
  checksum: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
  organizationId: z.string().trim().min(1).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional()
})
export type CreateUploadIntent = z.infer<typeof createUploadIntentSchema>

export const uploadIntentSchema = z.object({
  fileId: z.string(),
  sessionId: z.string(),
  method: z.literal('PUT'),
  uploadUrl: z.string(),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string()
})
export type UploadIntent = z.infer<typeof uploadIntentSchema>

export const completeUploadSchema = z.object({
  checksum: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i)
    .optional()
})
export type CompleteUpload = z.infer<typeof completeUploadSchema>

export const fileAccessUrlSchema = z.object({
  url: z.string(),
  expiresAt: z.string()
})
export type FileAccessUrl = z.infer<typeof fileAccessUrlSchema>

export const FILE_DISPOSITION_VALUES = ['inline', 'attachment'] as const
export const fileDispositionSchema = z.enum(FILE_DISPOSITION_VALUES)
export type FileDisposition = z.infer<typeof fileDispositionSchema>

export const fileAccessQuerySchema = z.object({
  disposition: fileDispositionSchema.default('inline')
})
export type FileAccessQuery = z.infer<typeof fileAccessQuerySchema>

export const fileListQuerySchema = pageQuerySchema.extend({
  purpose: filePurposeSchema.optional(),
  category: fileCategorySchema.optional(),
  status: fileStatusSchema.optional(),
  keyword: z.string().trim().min(1).max(100).optional(),
  includeDeleted: z.coerce.boolean().optional()
})
export type FileListQuery = z.infer<typeof fileListQuerySchema>

export const fileListResponseSchema = paged(fileAssetSchema)
export type FileListResponse = z.infer<typeof fileListResponseSchema>

export const bindFileSchema = z.object({
  fileId: z.string().min(1),
  entityType: z.string().trim().min(1).max(64),
  entityId: z.string().trim().min(1).max(64),
  relation: z.string().trim().min(1).max(64).default('attachment')
})
export type BindFile = z.infer<typeof bindFileSchema>

export const FILE_REF_PREFIX = 'file:'

export function toFileRef(fileId: string) {
  return `${FILE_REF_PREFIX}${fileId}`
}

export function parseFileRef(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.startsWith(FILE_REF_PREFIX)) return trimmed.slice(FILE_REF_PREFIX.length)
  const legacy = trimmed.match(/\/files\/([^/]+)\/(?:download|url)$/)
  return legacy?.[1] ?? null
}
