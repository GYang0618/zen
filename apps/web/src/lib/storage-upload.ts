import { request } from '@/lib/request'

import type { CreateUploadIntent, FileAsset, FilePurpose, UploadIntent } from '@zen/shared'

export type UploadEndpoint = 'storage' | 'avatar'

type PutProgress = {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export function putPresignedObject(
  url: string,
  file: File,
  headers: Record<string, string>,
  options: PutProgress = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      options.onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error(`对象上传失败（${xhr.status}）`))
    }
    xhr.onerror = () => reject(new Error('对象上传失败'))
    xhr.onabort = () => reject(new DOMException('上传已取消', 'AbortError'))
    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(file)
  })
}

export async function uploadWithIntent(input: {
  file: File
  purpose: Exclude<FilePurpose, 'legacy'>
  endpoint?: UploadEndpoint
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<FileAsset> {
  const endpoint = input.endpoint ?? (input.purpose === 'avatar' ? 'avatar' : 'storage')
  const intentPath = endpoint === 'avatar' ? '/me/avatar' : '/storage/uploads'
  const mimeType = input.file.type || 'application/octet-stream'
  const body: CreateUploadIntent = {
    purpose: input.purpose,
    originalName: input.file.name || 'unnamed',
    mimeType,
    size: input.file.size
  }

  const intent = await request.post<UploadIntent, CreateUploadIntent>(intentPath, body)
  await putPresignedObject(intent.uploadUrl, input.file, intent.headers, {
    onProgress: input.onProgress,
    signal: input.signal
  })

  const completePath =
    endpoint === 'avatar'
      ? `/me/avatar/${intent.fileId}/complete`
      : `/storage/uploads/${intent.fileId}/complete`

  return request.post<FileAsset>(completePath, {})
}
