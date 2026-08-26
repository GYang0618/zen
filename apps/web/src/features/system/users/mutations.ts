import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mapInfinitePageItems } from '@/lib/infinite-list'

import { userApi } from './api'
import { usersQueryKeys } from './queries'

import type { InfiniteData } from '@tanstack/react-query'
import type { User } from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

const USERS_LIST_QUERY_KEY = ['system', 'users', 'list'] as const
const USERS_INFINITE_QUERY_KEY = ['system', 'users', 'infinite'] as const
const ROLES_LIST_QUERY_KEY = ['system', 'roles', 'list'] as const
const ROLE_DETAIL_QUERY_KEY = ['system', 'roles', 'detail'] as const
const ROLE_MEMBERS_QUERY_KEY = ['system', 'roles', 'members'] as const

function mergeUserCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<User>
) {
  const applyPatch = (user: User) => (user.id === userId ? { ...user, ...patch } : user)

  queryClient.setQueryData<User>(usersQueryKeys.detail(userId), (current) =>
    current ? { ...current, ...patch } : current
  )
  queryClient.setQueriesData<PaginationResponse<User>>(
    { queryKey: USERS_LIST_QUERY_KEY },
    (current) => {
      if (!current) return current
      return {
        ...current,
        items: current.items.map(applyPatch)
      }
    }
  )
  queryClient.setQueriesData<InfiniteData<PaginationResponse<User>>>(
    { queryKey: USERS_INFINITE_QUERY_KEY },
    (current) => mapInfinitePageItems(current, applyPatch)
  )
}

function invalidateUserQueries(queryClient: ReturnType<typeof useQueryClient>, userId?: string) {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: USERS_INFINITE_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['organization'] }),
    queryClient.invalidateQueries({ queryKey: ['system', 'roles'] })
  ]
  if (userId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: ['system', 'users', 'detail', userId] }))
  }
  return Promise.all(tasks)
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'create'],
    mutationFn: userApi.createUser,
    onSuccess: async () => {
      await invalidateUserQueries(queryClient)
    }
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'update'],
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof userApi.updateUser>[1] }) =>
      userApi.updateUser(id, data),
    onSuccess: (result, variables) => {
      mergeUserCaches(queryClient, variables.id, result)
    }
  })
}

export function useDeleteUsersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'delete'],
    mutationFn: ({ ids, stepUpToken }: { ids: string[]; stepUpToken: string }) =>
      userApi.deleteUsers(ids, stepUpToken),
    onSuccess: async () => {
      await invalidateUserQueries(queryClient)
    }
  })
}

export function useUpdateUsersStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'status'],
    mutationFn: userApi.updateUsersStatus,
    onSuccess: async () => {
      await invalidateUserQueries(queryClient)
    }
  })
}

export function useUnlockUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'unlock'],
    mutationFn: (id: string) => userApi.unlock(id),
    onSuccess: async (_data, id) => {
      await invalidateUserQueries(queryClient, id)
    }
  })
}

export function useAdminResetPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'reset-password'],
    mutationFn: ({
      id,
      password,
      mustChangePassword
    }: {
      id: string
      password: string
      mustChangePassword?: boolean
    }) => userApi.adminResetPassword(id, { password, mustChangePassword }),
    onSuccess: async (_data, variables) => {
      await invalidateUserQueries(queryClient, variables.id)
    }
  })
}

export function useRevokeUserSessionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'revoke-sessions'],
    mutationFn: (id: string) => userApi.revokeSessions(id),
    onSuccess: async (_data, id) => {
      await invalidateUserQueries(queryClient, id)
    }
  })
}

export function useAssignUserRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'assign-roles'],
    mutationFn: ({
      id,
      roleIds,
      stepUpToken
    }: {
      id: string
      roleIds: string[]
      stepUpToken: string
    }) => userApi.assignRoles(id, { roleIds }, stepUpToken),
    onSuccess: (result, variables) => {
      mergeUserCaches(queryClient, variables.id, { roles: result.roles })

      const staleQueries = [
        queryClient.invalidateQueries({
          queryKey: ROLES_LIST_QUERY_KEY,
          refetchType: 'none'
        }),
        queryClient.invalidateQueries({
          queryKey: ['system', 'roles', 'infinite'],
          refetchType: 'none'
        }),
        queryClient.invalidateQueries({
          queryKey: ROLE_DETAIL_QUERY_KEY,
          refetchType: 'none'
        }),
        queryClient.invalidateQueries({
          queryKey: ROLE_MEMBERS_QUERY_KEY,
          refetchType: 'none'
        })
      ]
      void Promise.all(staleQueries)
    }
  })
}

export function useReplaceUserOrganizationsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'replace-organizations'],
    mutationFn: ({
      id,
      organizations
    }: {
      id: string
      organizations: Parameters<typeof userApi.replaceOrganizations>[1]['organizations']
    }) => userApi.replaceOrganizations(id, { organizations }),
    onSuccess: (result, variables) => {
      mergeUserCaches(queryClient, variables.id, {
        organizations: result.organizations
      })
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['organization'],
          refetchType: 'none'
        })
      ])
    }
  })
}
