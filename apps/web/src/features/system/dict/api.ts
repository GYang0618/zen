import { request } from '@/lib/request'

import type {
  CreateDictionaryInput,
  DictionaryDetail,
  DictionaryListItem,
  DictionaryWorkspaceListResponse,
  UpdateDictionaryInput,
  WorkspaceCreateInput,
  WorkspaceUpdateInput
} from '@zen/shared'

export interface DictListParams {
  workspaceId?: string
  search?: string
  kind?: string
}

export const dictApi = {
  getWorkspaces: () => request.get<DictionaryWorkspaceListResponse>('/dictionary/workspaces'),

  createWorkspace: (data: WorkspaceCreateInput) =>
    request.post<{
      id: string
      name: string
      dictionaryCount: number
      createdAt: string
      updatedAt: string
    }>('/dictionary/workspaces', data),

  updateWorkspace: (id: string, data: WorkspaceUpdateInput) =>
    request.patch<{
      id: string
      name: string
      dictionaryCount: number
      createdAt: string
      updatedAt: string
    }>(`/dictionary/workspaces/${id}`, data),

  deleteWorkspace: (id: string) => request.delete<{ id: string }>(`/dictionary/workspaces/${id}`),

  getDictionaryList: (params?: DictListParams) =>
    request.get<DictionaryListItem[]>('/dictionary/list', { params }),

  getDictionaryDetail: (id: string) => request.get<DictionaryDetail>(`/dictionary/${id}`),

  createDictionary: (data: CreateDictionaryInput) =>
    request.post<DictionaryDetail>('/dictionary', data),

  updateDictionary: (id: string, data: UpdateDictionaryInput) =>
    request.patch<DictionaryDetail>(`/dictionary/${id}`, data),

  toggleStar: (id: string, isStarred: boolean) =>
    request.patch<{ id: string; isStarred: boolean }>(`/dictionary/${id}/star`, { isStarred }),

  deleteDictionary: (id: string) => request.delete<{ id: string }>(`/dictionary/${id}`)
}
