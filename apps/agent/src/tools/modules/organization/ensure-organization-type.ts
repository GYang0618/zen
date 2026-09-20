import {
  executeApiCall,
  isToolFailureResult,
  organizationControllerGetTypeCatalog
} from '../../../api'
import {
  organizationTypeDisabledResult,
  parseOrganizationTypeCatalogItems
} from './organization-type-guard'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ToolExecutionContext } from '@zen/shared'

export async function ensureOrganizationTypeEnabled(
  type: string | undefined,
  config: RunnableConfig | undefined
): Promise<string | undefined> {
  if (!type) return undefined
  const raw = await executeApiCall(config, async (_context) =>
    organizationControllerGetTypeCatalog()
  )
  if (isToolFailureResult(raw)) return raw
  const items = parseOrganizationTypeCatalogItems(raw)
  if (!items) return undefined
  const item = items.find((entry) => entry.type === type)
  if (item && !item.enabled) return organizationTypeDisabledResult(type, items)
  return undefined
}

export async function createOrUpdateOrganization(
  config: RunnableConfig | undefined,
  type: string | undefined,
  call: (context: ToolExecutionContext) => Promise<unknown>
): Promise<string> {
  const blocked = await ensureOrganizationTypeEnabled(type, config)
  if (blocked) return blocked
  return executeApiCall(config, call)
}
