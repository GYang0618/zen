import { toast } from '@zen/ui'

import { storageApi } from './api'

import type { FileAsset } from '@zen/shared'

/** 复制图片的 inline 访问地址，可直接作为图片链接使用。 */
export async function copyImageAddress(file: Pick<FileAsset, 'id'>) {
  let url: string
  try {
    const result = await storageApi.getUrl(file.id, 'inline')
    url = result.url
  } catch (error) {
    toast.add({
      title: error instanceof Error ? error.message : '无法获取图片地址',
      type: 'error'
    })
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    toast.add({ title: '已复制图片地址', type: 'success' })
  } catch {
    toast.add({ title: '复制失败，请手动选择', type: 'error' })
  }
}
