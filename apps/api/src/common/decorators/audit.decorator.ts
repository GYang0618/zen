import { SetMetadata } from '@nestjs/common'

export const AUDIT_META_KEY = 'zen:audit'

export type AuditMeta = {
  action: string
  resource: string
  idParam?: string
}

export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_META_KEY, meta)
