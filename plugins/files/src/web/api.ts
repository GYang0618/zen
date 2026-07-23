import { FILE_PERMISSIONS } from '../constants'

import type { StoredFileDto } from '../file.schema'

export type FilesRequest = {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, body?: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
}

export function createFilesApi(request: FilesRequest) {
  return {
    list: () => request.get<StoredFileDto[]>('/files'),
    create: (body: { filename: string; mimeType?: string; size?: number; storageKey?: string }) =>
      request.post<StoredFileDto>('/files', body),
    remove: (id: string) => request.delete<StoredFileDto>(`/files/${id}`)
  }
}

export { FILE_PERMISSIONS }
