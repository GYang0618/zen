import { z } from 'zod'

export const dictKindSchema = z.enum(['business', 'system'])
export type DictKind = z.infer<typeof dictKindSchema>

export const dictStatusSchema = z.enum(['ACTIVE', 'DISABLED'])
export type DictStatus = z.infer<typeof dictStatusSchema>

export const dictionaryItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, '请输入字典项名称'),
  value: z.string().trim().min(1, '请输入字典项值'),
  description: z.string().trim().max(200, '描述最多200个字符').optional().nullable(),
  sort: z.number().int().default(0),
  status: dictStatusSchema.default('ACTIVE')
})
export type DictionaryItem = z.infer<typeof dictionaryItemSchema>

export const createDictionarySchema = z.object({
  name: z.string().trim().min(1, '字典名称不能为空').max(80, '字典名称最多80个字符'),
  code: z
    .string()
    .trim()
    .min(2, '字典编码至少2个字符')
    .max(80, '字典编码最多80个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '编码必须以小写字母开头，仅包含小写字母、数字与下划线'),
  folderId: z.string().min(1, '请选择所属空间'),
  kind: dictKindSchema.default('business'),
  description: z.string().trim().max(200, '描述最多200个字符').optional().nullable(),
  items: z.array(dictionaryItemSchema).default([])
})
export type CreateDictionaryInput = z.infer<typeof createDictionarySchema>

export const updateDictionarySchema = z.object({
  name: z.string().trim().min(1, '字典名称不能为空').max(80, '字典名称最多80个字符').optional(),
  folderId: z.string().min(1, '请选择所属空间').optional().nullable(),
  kind: dictKindSchema.optional(),
  description: z.string().trim().max(200, '描述最多200个字符').optional().nullable(),
  isStarred: z.boolean().optional(),
  items: z.array(dictionaryItemSchema).optional()
})
export type UpdateDictionaryInput = z.infer<typeof updateDictionarySchema>

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(1, '空间名称不能为空').max(80, '空间名称最多80个字符')
})
export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>

export const workspaceUpdateSchema = z.object({
  name: z.string().trim().min(1, '空间名称不能为空').max(80, '空间名称最多80个字符')
})
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>

export interface DictionaryListItem {
  id: string
  name: string
  code: string
  description: string | null
  kind: DictKind
  isStarred: boolean
  folderId: string | null
  folderName: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface DictionaryDetail extends DictionaryListItem {
  items: Array<{
    id: string
    label: string
    value: string
    description: string | null
    sort: number
    status: DictStatus
  }>
}

export interface DictionaryWorkspaceStats {
  allCount: number
  starredCount: number
}

export interface DictionaryWorkspaceItem {
  id: string
  name: string
  dictionaryCount: number
  createdAt: string
  updatedAt: string
}

export interface DictionaryWorkspaceListResponse {
  stats: DictionaryWorkspaceStats
  workspaces: DictionaryWorkspaceItem[]
}
