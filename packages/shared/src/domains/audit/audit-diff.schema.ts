import { z } from 'zod'

export const AUDIT_DIFF_VERSION = 1 as const

export const auditDiffTargetSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  code: z.string().optional()
})

export const auditDiffChangeSchema = z.object({
  field: z.string(),
  label: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable()
})

export const auditDiffMemberSchema = z.object({
  id: z.string(),
  name: z.string()
})

export const auditDiffPermissionSchema = z.object({
  code: z.string(),
  module: z.string(),
  name: z.string()
})

export const auditDiffFilterSchema = z.object({
  label: z.string(),
  value: z.string()
})

export const auditDiffSchema = z.object({
  version: z.literal(AUDIT_DIFF_VERSION),
  summary: z.string().optional(),
  target: auditDiffTargetSchema.optional(),
  changes: z.array(auditDiffChangeSchema).optional(),
  members: z
    .object({
      added: z.array(auditDiffMemberSchema).optional(),
      removed: z.array(auditDiffMemberSchema).optional()
    })
    .optional(),
  permissions: z
    .object({
      added: z.array(auditDiffPermissionSchema).optional(),
      removed: z.array(auditDiffPermissionSchema).optional()
    })
    .optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  /** 查询/导出：筛选条件（已翻译成中文 label）与命中条数 */
  query: z
    .object({
      filters: z.array(auditDiffFilterSchema),
      count: z.number().int().optional()
    })
    .optional(),
  /** 敏感读取：被查看的主体与字段 */
  sensitive: z
    .object({
      subject: auditDiffTargetSchema,
      fields: z.array(z.object({ field: z.string(), label: z.string() }))
    })
    .optional(),
  /** 拒绝：尝试的操作与缺少的权限 */
  denied: z
    .object({
      attempted: z.string(),
      missing: z.array(auditDiffPermissionSchema),
      subject: auditDiffTargetSchema.optional()
    })
    .optional(),
  /** 接口信息（越权、限流、Agent 调用时附带） */
  request: z
    .object({
      method: z.string(),
      route: z.string(),
      status: z.number().int(),
      latencyMs: z.number().int().optional()
    })
    .optional(),
  /** Agent 归因 */
  agent: z
    .object({
      toolName: z.string(),
      runId: z.string().optional(),
      approvalId: z.string().optional(),
      approverName: z.string().optional()
    })
    .optional()
})

export type AuditDiff = z.infer<typeof auditDiffSchema>
export type AuditDiffFilter = z.infer<typeof auditDiffFilterSchema>
export type AuditDiffChange = z.infer<typeof auditDiffChangeSchema>
export type AuditDiffMember = z.infer<typeof auditDiffMemberSchema>
export type AuditDiffPermission = z.infer<typeof auditDiffPermissionSchema>
export type AuditDiffTarget = z.infer<typeof auditDiffTargetSchema>

export function createAuditDiff(input: Omit<AuditDiff, 'version'>): AuditDiff {
  return auditDiffSchema.parse({
    version: AUDIT_DIFF_VERSION,
    ...input
  })
}

export function parseAuditDiff(value: unknown): AuditDiff | null {
  const parsed = auditDiffSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
