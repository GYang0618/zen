import { request } from '@/lib/request'

import type {
  FileAccessUrl,
  FileAsset,
  FileDisposition,
  FileListQuery,
  FilePurpose,
  FileStatus
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const storageApi = {
  list: (params?: FileListQuery) =>
    request.get<PaginationResponse<FileAsset>>('/storage/files', { params }),
  getOne: (id: string) => request.get<FileAsset>(`/storage/files/${id}`),
  getUrl: (id: string, disposition: FileDisposition = 'inline') =>
    request.get<FileAccessUrl>(`/storage/files/${id}/url`, { params: { disposition } }),
  softDelete: (id: string) => request.delete<FileAsset>(`/storage/files/${id}`),
  restore: (id: string) => request.post<FileAsset>(`/storage/files/${id}/restore`),
  purge: (id: string, stepUpToken: string) =>
    request.delete<void>(`/storage/files/${id}/purge`, {
      headers: { 'x-step-up-token': stepUpToken }
    })
}

export type { FileAsset, FileListQuery, FilePurpose, FileStatus }
