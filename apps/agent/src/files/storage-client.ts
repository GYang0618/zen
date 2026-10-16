import { getConfig } from '@langchain/langgraph'
import {
  CHAT_FILE_READ_MAX_BYTES,
  fileAccessUrlSchema,
  fileAssetSchema,
  uploadIntentSchema
} from '@zen/shared'

import { client } from '@/api/client'
import { getAccessTokenFromConfig, runWithRequestContext } from '@/api/request-context'
import { isRecord } from '@/api/tool-result'

import type { FileAsset } from '@zen/shared'

export async function downloadStorageFile(fileId: string) {
  return withStorageAuth(async () => {
    const asset = fileAssetSchema.parse(
      await client.get({ url: `/api/storage/files/${encodeURIComponent(fileId)}` })
    )
    if (asset.status !== 'ready') throw new Error('文件尚未就绪')
    if (asset.size > CHAT_FILE_READ_MAX_BYTES) throw new Error('文件过大，无法阅读')
    const access = fileAccessUrlSchema.parse(
      await client.get({
        url: `/api/storage/files/${encodeURIComponent(fileId)}/url?disposition=inline`
      })
    )
    const response = await fetch(access.url)
    if (!response.ok) throw new Error(`读取文件失败（${response.status}）`)
    return { asset, bytes: new Uint8Array(await response.arrayBuffer()) }
  })
}

export async function uploadExportFile(input: {
  name: string
  mimeType: string
  bytes: Uint8Array
}) {
  return withStorageAuth(async () => {
    const intent = uploadIntentSchema.parse(
      await client.post({
        url: '/api/storage/uploads',
        body: {
          purpose: 'export',
          originalName: input.name,
          mimeType: input.mimeType,
          size: input.bytes.byteLength
        }
      })
    )
    const uploaded = await fetch(intent.uploadUrl, {
      method: 'PUT',
      headers: intent.headers,
      body: Buffer.from(input.bytes)
    })
    if (!uploaded.ok) throw new Error(`写入对象存储失败（${uploaded.status}）`)
    return fileAssetSchema.parse(
      await client.post({
        url: `/api/storage/uploads/${encodeURIComponent(intent.fileId)}/complete`,
        body: {}
      })
    )
  })
}

export function storageErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (isRecord(error) && typeof error.message === 'string') return error.message
  return '文件服务请求失败'
}

export type StoredFile = {
  asset: FileAsset
  bytes: Uint8Array
}

async function withStorageAuth<T>(run: () => Promise<T>) {
  const accessToken = getAccessTokenFromConfig(getConfig())
  return runWithRequestContext({ accessToken }, run)
}
