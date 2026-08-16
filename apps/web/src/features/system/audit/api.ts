import { request } from '@/lib/request'

import type { PaginationResponse } from '@/lib/request'

export interface AuditLogItem {
  id: string
  tenantId: string
  actorId: string | null
  actorName: string | null
  action: string
  resource: string | null
  resourceId: string | null
  ip: string | null
  userAgent: string | null
  traceId: string | null
  diff: unknown
  createdAt: string
}

export interface LoginEventItem {
  id: string
  userId: string | null
  identifier: string
  success: boolean
  ip: string | null
  userAgent: string | null
  reason: string | null
  createdAt: string
}

export interface AuditQuery {
  keyword?: string
  action?: string
  page?: number
  pageSize?: number
}

export interface LoginEventQuery {
  userId?: string
  success?: boolean
  page?: number
  pageSize?: number
}

export const auditApi = {
  list: (params?: AuditQuery) =>
    request.get<PaginationResponse<AuditLogItem>>('/audit', { params }),
  listLoginEvents: (params?: LoginEventQuery) =>
    request.get<PaginationResponse<LoginEventItem>>('/audit/login-events', { params })
}
