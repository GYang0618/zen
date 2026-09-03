import { z } from 'zod'

export const dictStatusSchema = z
  .enum(['active', 'disabled'])
  .describe('字典项状态：active=启用；disabled=禁用')

export const createDictTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, '字典类型编码格式不正确'),
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).optional()
})

export const createDictItemSchema = z.object({
  typeCode: z.string().trim().min(1),
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(100),
  sort: z.number().int().min(0).max(9999).optional(),
  status: dictStatusSchema.default('active')
})

export const dictItemSchema = z.object({
  id: z.string(),
  typeCode: z.string(),
  label: z.string(),
  value: z.string(),
  sort: z.number(),
  status: dictStatusSchema
})

export const dictTypeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  items: z.array(dictItemSchema)
})

export type CreateDictType = z.infer<typeof createDictTypeSchema>
export type CreateDictItem = z.infer<typeof createDictItemSchema>
export type DictItem = z.infer<typeof dictItemSchema>
export type DictType = z.infer<typeof dictTypeSchema>
