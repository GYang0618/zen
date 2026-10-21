import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dictApi } from './api'
import { dictKeys } from './queries'

import type {
  CreateDictionaryInput,
  UpdateDictionaryInput,
  WorkspaceCreateInput,
  WorkspaceUpdateInput
} from '@zen/shared'

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkspaceCreateInput) => dictApi.createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictKeys.workspaces() })
    }
  })
}

export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkspaceUpdateInput }) =>
      dictApi.updateWorkspace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictKeys.workspaces() })
      queryClient.invalidateQueries({ queryKey: dictKeys.all })
    }
  })
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dictApi.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictKeys.workspaces() })
      queryClient.invalidateQueries({ queryKey: dictKeys.all })
    }
  })
}

export function useCreateDictionaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDictionaryInput) => dictApi.createDictionary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictKeys.all })
    }
  })
}

export function useUpdateDictionaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDictionaryInput }) =>
      dictApi.updateDictionary(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dictKeys.all })
      queryClient.invalidateQueries({ queryKey: dictKeys.detail(variables.id) })
    }
  })
}

export function useToggleStarMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      dictApi.toggleStar(id, isStarred),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dictKeys.all })
      queryClient.invalidateQueries({ queryKey: dictKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: dictKeys.workspaces() })
    }
  })
}

export function useDeleteDictionaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dictApi.deleteDictionary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictKeys.all })
      queryClient.invalidateQueries({ queryKey: dictKeys.workspaces() })
    }
  })
}
