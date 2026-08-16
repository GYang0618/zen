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
  meta: z.record(z.string(), z.unknown()).optional()
})

export type AuditDiff = z.infer<typeof auditDiffSchema>
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
