import { request } from '@/lib/request'

import type { SiteConfig } from '@zen/shared'

export const configApi = {
  get: () => request.get<SiteConfig>('/system/config'),
  update: (data: Partial<SiteConfig>) =>
    request.patch<SiteConfig, Partial<SiteConfig>>('/system/config', data)
}
