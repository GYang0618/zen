import { request } from '@/lib/request/client'

let cachedActiveIds: string[] | null = null
let inflight: Promise<string[]> | null = null

export async function fetchActivePluginIds(force = false): Promise<string[]> {
  if (!force && cachedActiveIds) return cachedActiveIds
  if (!force && inflight) return inflight

  inflight = request
    .get<{ ids: string[] }>('/plugins/active-ids')
    .then((result) => {
      cachedActiveIds = result.ids
      return result.ids
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function clearActivePluginIdsCache() {
  cachedActiveIds = null
}

export interface PluginListItem {
  id: string
  name: string
  version: string
  platformVersion: string
  dependsOn: string[]
  status: 'active' | 'inactive'
  installed: boolean
  config: Record<string, unknown> | null
}

export const pluginsApi = {
  list: () => request.get<{ items: PluginListItem[] }>('/plugins'),
  activate: (id: string) => request.post<PluginListItem>(`/plugins/${id}/activate`),
  deactivate: (id: string) => request.post<PluginListItem>(`/plugins/${id}/deactivate`),
  updateConfig: (id: string, config: Record<string, unknown>) =>
    request.patch<PluginListItem, Record<string, unknown>>(`/plugins/${id}/config`, config),
  activeIds: () => fetchActivePluginIds(true)
}
