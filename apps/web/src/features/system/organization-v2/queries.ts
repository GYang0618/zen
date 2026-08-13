import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { userApi } from '@/features/system/users/api'

import { organizationV2Api } from './api'

import type {
  AddOrganizationMember,
  ChangeOrganizationParent,
  CreateOrganization,
  CreatePosition,
  OrganizationActivitiesQuery,
  UpdateOrganization,
  UpdateOrganizationLeader,
  User
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'
import type { OrganizationUserOption } from './type'

export const organizationV2Keys = {
  all: ['organization-v2'] as const,
  tree: () => [...organizationV2Keys.all, 'tree'] as const,
  detail: (id: string) => [...organizationV2Keys.all, 'detail', id] as const,
  members: (id: string) => [...organizationV2Keys.all, 'members', id] as const,
  positions: (id: string) => [...organizationV2Keys.all, 'positions', id] as const,
  activities: (id: string) => [...organizationV2Keys.all, 'activities', id] as const,
  users: (keyword: string) => [...organizationV2Keys.all, 'users', keyword] as const
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
  await queryClient.invalidateQueries({ queryKey: organizationV2Keys.tree() })
  if (!organizationId) {
    await queryClient.invalidateQueries({ queryKey: organizationV2Keys.all })
    return
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.detail(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.members(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.positions(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.activities(organizationId) })
  ])
}

async function invalidateOrganizationMemberQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.tree() }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.detail(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.members(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.activities(organizationId) })
  ])
}

async function invalidateOrganizationPositionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.tree() }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.detail(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.positions(organizationId) }),
    queryClient.invalidateQueries({ queryKey: organizationV2Keys.activities(organizationId) })
  ])
}

export function useOrganizationTree() {
  return useQuery({
    queryKey: organizationV2Keys.tree(),
    queryFn: () => organizationV2Api.getTree()
  })
}

export function useOrganizationDetail(id: string) {
  return useQuery({
    queryKey: organizationV2Keys.detail(id),
    queryFn: () => organizationV2Api.getById(id),
    enabled: Boolean(id)
  })
}

export function useOrganizationMembers(id: string) {
  return useQuery({
    queryKey: organizationV2Keys.members(id),
    queryFn: () => organizationV2Api.listMembers(id),
    enabled: Boolean(id)
  })
}

export function useOrganizationPositions(id: string) {
  return useQuery({
    queryKey: organizationV2Keys.positions(id),
    queryFn: () => organizationV2Api.listPositions(id),
    enabled: Boolean(id)
  })
}

export function useOrganizationActivities(id: string, params?: OrganizationActivitiesQuery) {
  return useQuery({
    queryKey: [...organizationV2Keys.activities(id), params?.page ?? 1, params?.pageSize ?? 20],
    queryFn: () => organizationV2Api.listActivities(id, params),
    enabled: Boolean(id)
  })
}

/** 用户下拉选项；仅在弹层挂载时调用，避免无谓请求 */
export function useOrganizationUserOptions(keyword = '', enabled = true) {
  return useQuery({
    queryKey: organizationV2Keys.users(keyword.trim()),
    queryFn: async () => {
      const page = await userApi.getUserList({
        keyword: keyword.trim() || undefined,
        page: 1,
        pageSize: 20,
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
    mutationFn: (data: CreateOrganization) => organizationV2Api.create(data),
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
      organizationV2Api.update(id, data),
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
      organizationV2Api.updateLeader(id, data),
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
      organizationV2Api.changeParent(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateOrganizationQueries(queryClient, variables.id)
    },
    onError: (error: Error) => toast.error(error.message || '移动失败')
  })
}

export function useAddOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddOrganizationMember) => organizationV2Api.addMember(organizationId, data),
    onSuccess: async () => {
      await invalidateOrganizationMemberQueries(queryClient, organizationId)
      toast.success('成员已添加')
    },
    onError: (error: Error) => toast.error(error.message || '添加失败')
  })
}

export function useRemoveOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => organizationV2Api.removeMember(organizationId, userId),
    onSuccess: async () => {
      await invalidateOrganizationMemberQueries(queryClient, organizationId)
      toast.success('成员已移除')
    },
    onError: (error: Error) => toast.error(error.message || '移除失败')
  })
}

export function useCreateOrganizationPosition(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePosition) => organizationV2Api.createPosition(organizationId, data),
    onSuccess: async () => {
      await invalidateOrganizationPositionQueries(queryClient, organizationId)
      toast.success('岗位已创建')
    },
    onError: (error: Error) => toast.error(error.message || '创建失败')
  })
}
