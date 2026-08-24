import { extname } from 'node:path'

import { DEFAULT_TENANT_ID } from '@zen/shared'

import type { FilePurpose } from '@zen/shared'

const SAFE_EXT = /^\.[a-z0-9]{1,8}$/i

export function buildStorageKey(input: {
  tenantId?: string
  purpose: FilePurpose
  fileId: string
  originalName: string
  at?: Date
}) {
  const tenantId = input.tenantId || DEFAULT_TENANT_ID
  const now = input.at ?? new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const ext = extname(input.originalName).toLowerCase()
  const suffix = SAFE_EXT.test(ext) ? ext : ''
  return `tenants/${tenantId}/${input.purpose}/${year}/${month}/${input.fileId}${suffix}`
}
