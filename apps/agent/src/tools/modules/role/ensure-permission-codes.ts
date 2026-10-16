import { executeApiCall, isToolFailureResult, roleControllerListPermissions } from '../../../api'
import { parsePermissionCatalog, unknownPermissionCodesResult } from './role-permission-guard'

import type { RunnableConfig } from '@langchain/core/runnables'

export async function ensurePermissionCodesExist(
  codes: string[] | undefined,
  config: RunnableConfig | undefined
): Promise<string | undefined> {
  if (!codes || codes.length === 0) return undefined
  const raw = await executeApiCall(config, async (_context) => roleControllerListPermissions())
  if (isToolFailureResult(raw)) return raw
  const catalog = parsePermissionCatalog(raw)
  if (!catalog) return undefined
  const known = new Set(catalog.map((item) => item.code))
  const missing = [...new Set(codes.map((code) => code.trim()).filter(Boolean))].filter(
    (code) => !known.has(code)
  )
  if (missing.length > 0) return unknownPermissionCodesResult(missing, catalog)
  return undefined
}
