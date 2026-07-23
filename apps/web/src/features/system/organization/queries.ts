import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { organizationApi } from './api'

import type {
  CreateOrganization,
  CreatePost,
  UpdateOrganization,
  UpdatePost,
  UpsertOrganizationMember
} from '@zen/shared'

export const organizationKeys = {
  all: ['organization'] as const,
  tree: () => [...organizationKeys.all, 'tree'] as const,
  members: (organizationId: string) =>
    [...organizationKeys.all, 'members', organizationId] as const,
  posts: (organizationId?: string) => [...organizationKeys.all, 'posts', organizationId] as const
}

export function useOrganizationTree() {
  return useQuery({
    queryKey: organizationKeys.tree(),
    queryFn: () => organizationApi.getTree()
  })
}

export function useOrganizationMembers(organizationId: string | null) {
  return useQuery({
    queryKey: organizationKeys.members(organizationId ?? ''),
    queryFn: () => organizationApi.listMembers(organizationId as string),
    enabled: Boolean(organizationId)
  })
}

export function useOrganizationPosts(organizationId: string | null) {
  return useQuery({
    queryKey: organizationKeys.posts(organizationId ?? undefined),
    queryFn: () => organizationApi.listPosts(organizationId ?? undefined),
    enabled: Boolean(organizationId)
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrganization) => organizationApi.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('组织已更新')
    },
    onError: (error: Error) => toast.error(error.message || '更新失败')
  })
}

export function useDeleteOrganizations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => organizationApi.remove({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('组织已删除')
    },
    onError: (error: Error) => toast.error(error.message || '删除失败')
  })
}

export function useUpsertOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertOrganizationMember) =>
      organizationApi.upsertMember(organizationId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('成员已更新')
    },
    onError: (error: Error) => toast.error(error.message || '操作失败')
  })
}

export function useRemoveOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => organizationApi.removeMember(organizationId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('成员已移除')
    },
    onError: (error: Error) => toast.error(error.message || '移除失败')
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePost) => organizationApi.createPost(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('岗位已创建')
    },
    onError: (error: Error) => toast.error(error.message || '创建失败')
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePost }) =>
      organizationApi.updatePost(postId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('岗位已更新')
    },
    onError: (error: Error) => toast.error(error.message || '更新失败')
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => organizationApi.deletePost(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toast.success('岗位已删除')
    },
    onError: (error: Error) => toast.error(error.message || '删除失败')
  })
}
