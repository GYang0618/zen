import type { FileCategory, FilePurpose, FileStatus } from '@zen/shared'

export const CATEGORY_LABEL: Record<FileCategory, string> = {
  image: '图片',
  video: '视频',
  document: '文档',
  archive: '压缩包',
  other: '其他'
}

export const PURPOSE_LABEL: Record<FilePurpose, string> = {
  avatar: '头像',
  attachment: '附件',
  export: '导出',
  temp: '临时',
  legacy: '历史'
}

export const STATUS_LABEL: Record<FileStatus, string> = {
  pending: '待上传',
  uploaded: '已上传',
  quarantined: '隔离',
  ready: '就绪',
  deleted: '回收站',
  purged: '已清除'
}

export const CATEGORY_TABS: Array<{ value: FileCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'document', label: '文档' },
  { value: 'archive', label: '压缩包' }
]

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

/** 取接近片头的可解码位置：0 秒在部分编码下是空帧，超短视频则仍用 0。 */
export function firstFrameTime(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  if (duration <= 0.2) return 0
  return 0.1
}
