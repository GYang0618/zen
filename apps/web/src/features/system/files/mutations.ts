import { useMutation, useQueryClient } from '@tanstack/react-query'

import { storageApi } from './api'
import { filesQueryKeys } from './queries'

function invalidateFiles(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: filesQueryKeys.all })
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => storageApi.softDelete(id),
    onSuccess: () => invalidateFiles(queryClient)
  })
}

export function useRestoreFileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => storageApi.restore(id),
    onSuccess: () => invalidateFiles(queryClient)
  })
}

export function usePurgeFileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stepUpToken }: { id: string; stepUpToken: string }) =>
      storageApi.purge(id, stepUpToken),
    onSuccess: () => invalidateFiles(queryClient)
  })
}
