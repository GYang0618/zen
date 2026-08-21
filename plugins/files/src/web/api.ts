import { FILE_PERMISSIONS } from '../constants'

import type { StoredFileDto } from '../file.schema'

export type FilesRequest = {
  get: <T>(url: string) => Promise<T>
  post: <T>(url: string, body?: unknown, config?: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
}

export function createFilesApi(request: FilesRequest) {
  return {
    list: () => request.get<StoredFileDto[]>('/files'),
    create: (body: { filename: string; mimeType?: string; size?: number; storageKey?: string }) =>
      request.post<StoredFileDto>('/files', body),
    upload: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post<StoredFileDto>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    remove: (id: string) => request.delete<StoredFileDto>(`/files/${id}`)
  }
}

export { FILE_PERMISSIONS }
