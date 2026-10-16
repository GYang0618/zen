import { request } from '@/lib/request'

import type { CreateUploadIntent, FileAsset, FilePurpose, UploadIntent } from '@zen/shared'

export type UploadEndpoint = 'storage' | 'avatar'

export type UploadOutcome = {
  file: FileAsset
  deduplicated: boolean
}

type PutProgress = {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('上传已取消', 'AbortError')
}

/** 原文件字节的 SHA-256，十六进制小写。相同内容得到相同结果。 */
export async function digestFileSha256(file: Blob, signal?: AbortSignal) {
  throwIfAborted(signal)
  const bytes = await file.arrayBuffer()
  throwIfAborted(signal)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
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
  checksum?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<UploadOutcome> {
  const endpoint = input.endpoint ?? (input.purpose === 'avatar' ? 'avatar' : 'storage')
  const intentPath = endpoint === 'avatar' ? '/me/avatar' : '/storage/uploads'
  const mimeType = input.file.type || 'application/octet-stream'
  const checksum = input.checksum ?? (await digestFileSha256(input.file, input.signal))
  const body: CreateUploadIntent = {
    purpose: input.purpose,
    originalName: input.file.name || 'unnamed',
    mimeType,
    size: input.file.size,
    checksum
  }

  const intent = await request.post<UploadIntent, CreateUploadIntent>(intentPath, body)
  if (intent.deduplicated) {
    if (endpoint === 'avatar') {
      const file = await request.post<FileAsset>(`/me/avatar/${intent.fileId}/complete`, {})
      return { file, deduplicated: true }
    }
    if (!intent.file) throw new Error('相同内容的文件已存在，但缺少文件信息')
    return { file: intent.file, deduplicated: true }
  }

  await putPresignedObject(intent.uploadUrl, input.file, intent.headers, {
    onProgress: input.onProgress,
    signal: input.signal
  })

  const completePath =
    endpoint === 'avatar'
      ? `/me/avatar/${intent.fileId}/complete`
      : `/storage/uploads/${intent.fileId}/complete`

  const file = await request.post<FileAsset>(completePath, { checksum })
  return { file, deduplicated: file.id !== intent.fileId }
}
