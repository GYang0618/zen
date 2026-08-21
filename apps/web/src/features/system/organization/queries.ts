import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  allowedEnabledChildTypes,
  buildOrganizationTypeCatalog,
  enabledRootOrganizationTypes,
  getCatalogTypeLabel
} from '@zen/shared'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { postKeys } from '@/features/system/posts/queries'
import { userApi } from '@/features/system/users/api'
import { silentRefreshAuthSession } from '@/lib/request'

import { organizationApi } from './api'

import type { QueryClient } from '@tanstack/react-query'
import type {
  AddOrganizationMember,
  ChangeOrganizationParent,
  CreateOrganization,
  LinkOrganizationPosition,
  Organization,
  OrganizationActivitiesQuery,
  OrganizationMember,
  UpdateOrganization,
  UpdateOrganizationLeader,
  UpdateOrganizationTypeCatalog,
  User
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'
import type { OrganizationUserOption } from './type'

export const organizationKeys = {
  all: ['organization'] as const,
  tree: () => [...organizationKeys.all, 'tree'] as const,
  detail: (id: string) => [...organizationKeys.all, 'detail', id] as const,
  members: (id: string) => [...organizationKeys.all, 'members', id] as const,
  positions: (id: string) => [...organizationKeys.all, 'positions', id] as const,
  activities: (id: string) => [...organizationKeys.all, 'activities', id] as const,
  users: (keyword: string) => [...organizationKeys.all, 'users', keyword] as const,
  typeCatalog: () => [...organizationKeys.all, 'type-catalog'] as const
}

function mapUserOptions(page: PaginationResponse<User>): OrganizationUserOption[] {
  return page.items.map((user) => {
    const primary = user.organizations?.find((item) => item.isPrimary) ?? user.organizations?.[0]
    return {
      id: user.id,
      name: user.realName ?? user.nickname ?? user.username,
      title: primary?.postName ?? '',
      avatar: user.avatar ?? '',
      email: user.email,
      phone: user.phoneNumber ?? ''
    }
  })
}

async function invalidateOrganizationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId?: string
) {
  await queryClient.invalidateQueries({ queryKey: organizationKeys.tree() })
  if (!organizationId) {
    await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    return
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationKeys.detail(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.members(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.positions(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.activities(organizationId) })
  ])
}

function patchOrganizationMemberCount(
  queryClient: QueryClient,
  organizationId: string,
  delta: number
) {
  queryClient.setQueryData<Organization>(organizationKeys.detail(organizationId), (prev) => {
    if (!prev) return prev
    return { ...prev, memberCount: Math.max(0, prev.memberCount + delta) }
  })
}

/** 成员变更只影响当事人，操作者无需换发 token；本地更新列表与人数，避免重复拉详情/成员 */
async function settleOrganizationMemberChange(
  queryClient: QueryClient,
  organizationId: string,
  options: {
    delta: number
    updateMembers: (prev: OrganizationMember[] | undefined) => OrganizationMember[] | undefined
  }
) {
  queryClient.setQueryData<OrganizationMember[]>(
    organizationKeys.members(organizationId),
    options.updateMembers
  )
  patchOrganizationMemberCount(queryClient, organizationId, options.delta)
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationKeys.tree() }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.activities(organizationId) })
  ])
}

async function invalidateOrganizationPositionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationKeys.tree() }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.detail(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.positions(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationKeys.activities(organizationId) })
  ])
}

export function useOrganizationTree(enabled = true) {
  return useQuery({
    queryKey: organizationKeys.tree(),
    queryFn: () => organizationApi.getTree(),
    enabled
  })
}

const FALLBACK_TYPE_CATALOG = buildOrganizationTypeCatalog(null)

export function useOrganizationTypeCatalog() {
  const query = useQuery({
    queryKey: organizationKeys.typeCatalog(),
    queryFn: () => organizationApi.getTypeCatalog(),
    staleTime: 60_000
  })
  const catalog = query.data?.catalog ?? FALLBACK_TYPE_CATALOG
  const inUseTypes = query.data?.inUseTypes ?? []

  return useMemo(
    () => ({
      ...query,
      catalog,
      inUseTypes,
      getLabel: (type: string) => getCatalogTypeLabel(type, catalog),
      allowedChildTypes: (parentType: string) => allowedEnabledChildTypes(parentType, catalog),
      rootTypes: enabledRootOrganizationTypes(catalog)
    }),
    [catalog, inUseTypes, query]
  )
}

export function useUpdateOrganizationTypeCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateOrganizationTypeCatalog) => organizationApi.updateTypeCatalog(data),
    onSuccess: async (response) => {
      queryClient.setQueryData(organizationKeys.typeCatalog(), response)
      toast.success('组织类型已更新')
    },
    onError: (error: Error) => toast.error(error.message || '更新失败')
  })
}

export function useOrganizationDetail(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationApi.getById(id),
    enabled: Boolean(id)
  })
}

export function useOrganizationMembers(id: string) {
  return useQuery({
    queryKey: organizationKeys.members(id),
    queryFn: () => organizationApi.listMembers(id),
    enabled: Boolean(id)
  })
}

export function useOrganizationPositions(id: string) {
  return useQuery({
    queryKey: organizationKeys.positions(id),
    queryFn: () => organizationApi.listPositions(id),
    enabled: Boolean(id)
  })
}

export function useOrganizationActivities(id: string, params?: OrganizationActivitiesQuery) {
  return useQuery({
    queryKey: [...organizationKeys.activities(id), params?.page ?? 1, params?.pageSize ?? 20],
    queryFn: () => organizationApi.listActivities(id, params),
    enabled: Boolean(id)
  })
}

/** 用户下拉选项；仅在弹层挂载时调用，避免无谓请求 */
export function useOrganizationUserOptions(keyword = '', enabled = true) {
  return useQuery({
    queryKey: organizationKeys.users(keyword.trim()),
    queryFn: async () => {
      const page = await userApi.getUserList({
        keyword: keyword.trim() || undefined,
        page: 1,
        pageSize: 50,
        status: 'active'
      })
      return mapUserOptions(page)
    },
    enabled,
    staleTime: 30_000
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrganization) => organizationApi.create(data),
    onSuccess: async () => {
      await invalidateOrganizationQueries(queryClient)
      toast.success('组织已创建')
    },
    onError: (error: Error) => toast.error(error.message || '创建失败')
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganization }) =>
      organizationApi.update(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateOrganizationQueries(queryClient, variables.id)
      toast.success('组织已更新')
    },
    onError: (error: Error) => toast.error(error.message || '更新失败')
  })
}

export function useUpdateOrganizationLeader() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationLeader }) =>
      organizationApi.updateLeader(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateOrganizationQueries(queryClient, variables.id)
      toast.success('负责人已更新')
    },
    onError: (error: Error) => toast.error(error.message || '更新失败')
  })
}

export function useChangeOrganizationParent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeOrganizationParent }) =>
      organizationApi.changeParent(id, data),
    onSuccess: async (_data, variables) => {
      // 变更父级会 bump permVer，先刷新 token 再拉树/详情
      await silentRefreshAuthSession()
      await invalidateOrganizationQueries(queryClient, variables.id)
    },
    onError: (error: Error) => toast.error(error.message || '移动失败')
  })
}

export function useAddOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddOrganizationMember) => organizationApi.addMember(organizationId, data),
    onSuccess: async (members) => {
      const added = members ?? []
      await settleOrganizationMemberChange(queryClient, organizationId, {
        delta: added.length,
        updateMembers: (prev) => {
          if (!prev) return added
          const existingIds = new Set(prev.map((item) => item.id))
          return [...prev, ...added.filter((item) => !existingIds.has(item.id))]
        }
      })
      toast.success(added.length > 1 ? `已添加 ${added.length} 名成员` : '成员已添加')
    },
    onError: (error: Error) => toast.error(error.message || '添加失败')
  })
}

export function useRemoveOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => organizationApi.removeMember(organizationId, userId),
    onSuccess: async (_data, userId) => {
      await settleOrganizationMemberChange(queryClient, organizationId, {
        delta: -1,
        updateMembers: (prev) => prev?.filter((item) => item.id !== userId)
      })
      toast.success('成员已移除')
    },
    onError: (error: Error) => toast.error(error.message || '移除失败')
  })
}

export function useCreateOrganizationPosition(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LinkOrganizationPosition) =>
      organizationApi.createPosition(organizationId, data),
    onSuccess: async () => {
      await invalidateOrganizationPositionQueries(queryClient, organizationId)
      await queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success('岗位已关联')
    },
    onError: (error: Error) => toast.error(error.message || '关联失败')
  })
}

export function useRemoveOrganizationPosition(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (positionId: string) => organizationApi.removePosition(organizationId, positionId),
    onSuccess: async () => {
      await invalidateOrganizationPositionQueries(queryClient, organizationId)
      await queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success('已取消岗位关联')
    },
    onError: (error: Error) => toast.error(error.message || '取消关联失败')
  })
}
