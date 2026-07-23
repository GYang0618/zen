import { useQuery } from '@tanstack/react-query'

import { auditApi } from './api'

import type { AuditQuery, LoginEventQuery } from './api'

export const auditKeys = {
  all: ['audit'] as const,
  list: (query: AuditQuery) => [...auditKeys.all, 'list', query] as const,
  loginEvents: (query: LoginEventQuery) => [...auditKeys.all, 'login-events', query] as const
}

export function useAuditList(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => auditApi.list(query)
  })
}

export function useLoginEvents(query: LoginEventQuery) {
  return useQuery({
    queryKey: auditKeys.loginEvents(query),
    queryFn: () => auditApi.listLoginEvents(query)
  })
}
