export const FILE_CATEGORY_VALUES = ['image', 'video', 'document', 'archive', 'other'] as const
export type FileCategory = (typeof FILE_CATEGORY_VALUES)[number]

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v'])
const DOCUMENT_EXT = new Set([
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx'
])
const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'])

const DOCUMENT_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
])

const ARCHIVE_MIME = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/gzip',
  'application/x-tar',
  'application/x-gzip'
])

const OFFICE_ZIP_MIME: Record<string, string> = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
}

export function fileExtname(originalName: string | null | undefined) {
  const base = (originalName ?? '').split(/[/\\]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot).toLowerCase()
}

export function resolveOfficeZipMime(originalName: string | null | undefined) {
  return OFFICE_ZIP_MIME[fileExtname(originalName)]
}

export function resolveFileCategory(input: {
  mimeType?: string | null
  originalName?: string | null
}): FileCategory {
  const mime = (input.mimeType ?? '').toLowerCase().split(';')[0]?.trim() ?? ''
  const ext = fileExtname(input.originalName)

  if (DOCUMENT_EXT.has(ext) || DOCUMENT_MIME.has(mime)) return 'document'
  if (ARCHIVE_EXT.has(ext) || ARCHIVE_MIME.has(mime)) return 'archive'
  if (mime.startsWith('image/') || IMAGE_EXT.has(ext)) return 'image'
  if (mime.startsWith('video/') || VIDEO_EXT.has(ext)) return 'video'
  return 'other'
}

export const FILE_CATEGORY_ACCEPT: Record<FileCategory | 'all', string | undefined> = {
  all: 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz',
  image: 'image/jpeg,image/png,image/gif,image/webp',
  video: 'video/mp4,video/webm,video/quicktime',
  document: '.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  archive: '.zip,.rar,.7z,.tar,.gz',
  other: undefined
}
