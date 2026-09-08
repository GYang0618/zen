import { toast } from 'sonner'

import { storageApi } from './api'

import type { FileAsset } from '@zen/shared'

export async function downloadFile(file: Pick<FileAsset, 'id'>) {
  try {
    const { url } = await storageApi.getUrl(file.id, 'attachment')
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '无法下载文件')
  }
}
