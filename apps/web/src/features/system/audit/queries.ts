import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import { CARD_PAGE_SIZE, getNextPageParam } from '@/lib/infinite-list'

import { auditApi } from './api'

import type {
  AgentRunQuery,
  AgentStatsQuery,
  ApiAccessLogQuery,
  ApiAccessStatsQuery,
  AuditQuery,
  CreateAiModelPriceDto,
  LoginEventQuery,
  UpdateAiQuotaDto
} from './api'

type AuditListFilters = Omit<AuditQuery, 'page' | 'pageSize'>
type LoginEventsFilters = Omit<LoginEventQuery, 'page' | 'pageSize'>
type AccessLogsFilters = Omit<ApiAccessLogQuery, 'page' | 'pageSize'>
type AgentRunsFilters = Omit<AgentRunQuery, 'page' | 'pageSize'>

export const auditKeys = {
  all: ['audit'] as const,
  list: (query: AuditQuery) => [...auditKeys.all, 'list', query] as const,
  infiniteList: (query: AuditListFilters) => [...auditKeys.all, 'infinite-list', query] as const,
  loginEvents: (query: LoginEventQuery) => [...auditKeys.all, 'login-events', query] as const,
  infiniteLoginEvents: (query: LoginEventsFilters) =>
    [...auditKeys.all, 'infinite-login-events', query] as const,
  accessLogs: (query: ApiAccessLogQuery) => [...auditKeys.all, 'access-logs', query] as const,
  infiniteAccessLogs: (query: AccessLogsFilters) =>
    [...auditKeys.all, 'infinite-access-logs', query] as const,
  accessStats: (query?: ApiAccessStatsQuery) => [...auditKeys.all, 'access-stats', query] as const,
  agentStats: (query?: AgentStatsQuery) => [...auditKeys.all, 'agent-stats', query] as const,
  agentRuns: (query: AgentRunQuery) => [...auditKeys.all, 'agent-runs', query] as const,
  infiniteAgentRuns: (query: AgentRunsFilters) =>
    [...auditKeys.all, 'infinite-agent-runs', query] as const,
  agentRunDetail: (runId: string) => [...auditKeys.all, 'agent-run-detail', runId] as const,
  aiQuotas: () => [...auditKeys.all, 'ai-quotas'] as const,
  aiModelPrices: () => [...auditKeys.all, 'ai-model-prices'] as const
}

export function useAuditList(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => auditApi.list(query)
  })
}

export function useAuditInfiniteQuery(filters: AuditListFilters) {
  return useInfiniteQuery({
    queryKey: auditKeys.infiniteList(filters),
    queryFn: ({ pageParam }) =>
      auditApi.list({ ...filters, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData
  })
}

export function useLoginEvents(query: LoginEventQuery) {
  return useQuery({
    queryKey: auditKeys.loginEvents(query),
    queryFn: () => auditApi.listLoginEvents(query)
  })
}

export function useLoginEventsInfiniteQuery(filters: LoginEventsFilters) {
  return useInfiniteQuery({
    queryKey: auditKeys.infiniteLoginEvents(filters),
    queryFn: ({ pageParam }) =>
      auditApi.listLoginEvents({ ...filters, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData
  })
}

export function useAccessLogs(query: ApiAccessLogQuery) {
  return useQuery({
    queryKey: auditKeys.accessLogs(query),
    queryFn: () => auditApi.listAccessLogs(query)
  })
}

export function useAccessLogsInfiniteQuery(filters: AccessLogsFilters) {
  return useInfiniteQuery({
    queryKey: auditKeys.infiniteAccessLogs(filters),
    queryFn: ({ pageParam }) =>
      auditApi.listAccessLogs({ ...filters, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData
  })
}

export function useAgentRuns(query: AgentRunQuery) {
  return useQuery({
    queryKey: auditKeys.agentRuns(query),
    queryFn: () => auditApi.listAgentRuns(query)
  })
}

export function useAgentRunsInfiniteQuery(filters: AgentRunsFilters) {
  return useInfiniteQuery({
    queryKey: auditKeys.infiniteAgentRuns(filters),
    queryFn: ({ pageParam }) =>
      auditApi.listAgentRuns({ ...filters, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData
  })
}

export function useAccessStats(query?: ApiAccessStatsQuery) {
  return useQuery({
    queryKey: auditKeys.accessStats(query),
    queryFn: () => auditApi.getAccessStats(query)
  })
}

export function useAgentStats(query?: AgentStatsQuery) {
  return useQuery({
    queryKey: auditKeys.agentStats(query),
    queryFn: () => auditApi.getAgentStats(query)
  })
}

export function useAgentRunDetail(runId: string, enabled = true) {
  return useQuery({
    queryKey: auditKeys.agentRunDetail(runId),
    queryFn: () => auditApi.getAgentRunDetail(runId),
    enabled: Boolean(runId) && enabled
  })
}

export function useAiQuotas() {
  return useQuery({
    queryKey: auditKeys.aiQuotas(),
    queryFn: () => auditApi.listAiQuotas()
  })
}

export function useUpdateAiQuota() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAiQuotaDto }) =>
      auditApi.updateAiQuota(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auditKeys.aiQuotas() })
    }
  })
}

export function useAiModelPrices() {
  return useQuery({
    queryKey: auditKeys.aiModelPrices(),
    queryFn: () => auditApi.listAiModelPrices()
  })
}

export function useCreateAiModelPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAiModelPriceDto) => auditApi.createAiModelPrice(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auditKeys.aiModelPrices() })
    }
  })
}
