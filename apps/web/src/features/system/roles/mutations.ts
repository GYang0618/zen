import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ROLE_MEMBER_PREVIEW_LIMIT } from '@zen/shared'

import { roleApi } from './api'
import { ROLE_DETAIL_QUERY_KEY, ROLE_MEMBERS_QUERY_KEY, ROLES_LIST_QUERY_KEY } from './queries'

import type { QueryClient } from '@tanstack/react-query'
import type {
  AssignRoleDataScope,
  AssignRoleMembers,
  AssignRolePermissions,
  CloneRole,
  Role,
  RoleMember
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

async function invalidateRoleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  roleId?: string
) {
  const tasks = [queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })]
  if (roleId) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: [...ROLE_MEMBERS_QUERY_KEY, roleId] }),
      queryClient.invalidateQueries({ queryKey: [...ROLE_DETAIL_QUERY_KEY, roleId] }),
      queryClient.invalidateQueries({ queryKey: ['system', 'users', 'list'] })
    )
  }
  await Promise.all(tasks)
}

function patchRoleMembers(role: Role, membersPage: PaginationResponse<RoleMember>): Role {
  return {
    ...role,
    memberCount: membersPage.pagination.total,
    memberPreview: membersPage.items.slice(0, ROLE_MEMBER_PREVIEW_LIMIT).map((member) => ({
      id: member.id,
      nickname: member.realName ?? member.nickname ?? member.username,
      avatar: member.avatar
    }))
  }
}

function updateRoleMemberCaches(
  queryClient: QueryClient,
  roleId: string,
  membersPage: PaginationResponse<RoleMember>
) {
  queryClient.setQueryData([...ROLE_MEMBERS_QUERY_KEY, roleId], membersPage)
  queryClient.setQueryData<Role>([...ROLE_DETAIL_QUERY_KEY, roleId], (role) =>
    role ? patchRoleMembers(role, membersPage) : role
  )
  queryClient.setQueriesData<PaginationResponse<Role>>(
    { queryKey: ROLES_LIST_QUERY_KEY },
    (page) => {
      if (!page) return page
      return {
        ...page,
        items: page.items.map((role) =>
          role.id === roleId ? patchRoleMembers(role, membersPage) : role
        )
      }
    }
  )
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'create'],
    mutationFn: roleApi.createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })
    }
  })
}

export function useCloneRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'clone'],
    mutationFn: ({ id, data }: { id: string; data: CloneRole }) => roleApi.cloneRole(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })
    }
  })
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'update'],
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof roleApi.updateRole>[1] }) =>
      roleApi.updateRole(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateRoleQueries(queryClient, variables.id)
    }
  })
}

export function useAssignRolePermissionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'permissions'],
    mutationFn: ({ id, data }: { id: string; data: AssignRolePermissions }) =>
      roleApi.assignPermissions(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateRoleQueries(queryClient, variables.id)
    }
  })
}

export function useAssignRoleDataScopeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'data-scope'],
    mutationFn: ({ id, data }: { id: string; data: AssignRoleDataScope }) =>
      roleApi.assignDataScope(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateRoleQueries(queryClient, variables.id)
    }
  })
}

export function useDeleteRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'delete'],
    mutationFn: (ids: string[]) => roleApi.deleteRoles({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })
    }
  })
}

export function useAddRoleMembersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'members', 'add'],
    mutationFn: ({ id, data }: { id: string; data: AssignRoleMembers }) =>
      roleApi.addRoleMembers(id, data),
    onSuccess: (membersPage, variables) => {
      updateRoleMemberCaches(queryClient, variables.id, membersPage)
    }
  })
}

export function useRemoveRoleMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'members', 'remove'],
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      roleApi.removeRoleMember(id, userId),
    onSuccess: (membersPage, variables) => {
      updateRoleMemberCaches(queryClient, variables.id, membersPage)
    }
  })
}
