import { fileExtname, resolveOfficeZipMime } from './file-category.js'

/** 对象存储文件 ID：创建上传意图时取 UUID 去横线后的前 24 位十六进制 */
const STORAGE_FILE_ID = '[a-f0-9]{24}'

export const CHAT_UPLOAD_DIR = '/uploads'
export const CHAT_EXPORT_DIR = '/exports'
export const CHAT_FILE_PATH_SEPARATOR = '--'
export const CHAT_ATTACHMENT_MANIFEST_TAG = 'attachments'
export const CHAT_ATTACHMENT_MAX_COUNT = 8
export const CHAT_FILE_READ_MAX_BYTES = 20 * 1024 * 1024

const WORD_MIME = 'application/msword'
const EXCEL_MIME = 'application/vnd.ms-excel'
const DOCX_MIME = resolveOfficeZipMime('file.docx') ?? ''
const XLSX_MIME = resolveOfficeZipMime('file.xlsx') ?? ''

const EXTENSION_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.doc': WORD_MIME,
  '.docx': DOCX_MIME,
  '.xls': EXCEL_MIME,
  '.xlsx': XLSX_MIME
}

const ALLOWED_ATTACHMENT_MIMES = new Set(Object.values(EXTENSION_MIME))

/** 对话导出允许写入对象存储的类型。pdf / zip 仍由存储策略单独保留。 */
export const CHAT_EXPORT_MIME_TYPES = ['text/plain', 'text/csv', DOCX_MIME, XLSX_MIME] as const

export const CHAT_ATTACHMENT_ACCEPT = Object.entries(EXTENSION_MIME).flat().join(',')

export type ChatAttachmentRef = {
  fileId: string
  name: string
  mimeType: string
  size: number
}

export type ChatUserContentPart =
  | { type: 'text'; text: string }
  | { type: 'binary'; mimeType: string; id: string; filename: string }

export type ChatFileKind = 'text' | 'docx' | 'xlsx' | 'image' | 'legacy' | 'archive' | 'unsupported'

const ARCHIVE_EXTENSIONS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'])
const ARCHIVE_MIMES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/gzip',
  'application/x-tar',
  'application/x-gzip'
])

const UPLOAD_PATH = new RegExp(
  `^${CHAT_UPLOAD_DIR}/(${STORAGE_FILE_ID})${CHAT_FILE_PATH_SEPARATOR}([^/]+)$`
)
const EXPORT_PATH = new RegExp(
  `^${CHAT_EXPORT_DIR}/(${STORAGE_FILE_ID})${CHAT_FILE_PATH_SEPARATOR}([^/]+)$`
)
const EXPORT_PATH_GLOBAL = new RegExp(
  `${CHAT_EXPORT_DIR}/(${STORAGE_FILE_ID})${CHAT_FILE_PATH_SEPARATOR}([^\\s'"]+)`,
  'g'
)
const MANIFEST_BLOCK = new RegExp(
  `<${CHAT_ATTACHMENT_MANIFEST_TAG}>[\\s\\S]*?</${CHAT_ATTACHMENT_MANIFEST_TAG}>`,
  'g'
)

export function sanitizeChatFileName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? ''
  const cleaned = [...base]
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 32 && char !== "'" && char !== '"'
    })
    .join('')
    .replace(/\s+/g, '_')
    .replace(/--+/g, '-')
    .trim()
  if (!cleaned || cleaned === '.' || cleaned === '..' || cleaned === '~') return 'file'
  return cleaned.slice(0, 120)
}

export function resolveChatAttachmentMime(file: { name: string; type: string }) {
  const browserType = file.type.toLowerCase().split(';')[0]?.trim() ?? ''
  if (
    browserType &&
    browserType !== 'application/octet-stream' &&
    ALLOWED_ATTACHMENT_MIMES.has(browserType)
  ) {
    return browserType
  }
  const mapped = EXTENSION_MIME[fileExtname(file.name)]
  return mapped || undefined
}

export function chatExportMime(name: string) {
  const extension = fileExtname(name)
  if (extension === '.txt') return 'text/plain'
  if (extension === '.csv') return 'text/csv'
  if (extension === '.docx') return DOCX_MIME || undefined
  if (extension === '.xlsx') return XLSX_MIME || undefined
  return undefined
}

export function chatFileKind(name: string, mimeType: string): ChatFileKind {
  const extension = fileExtname(name)
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? ''
  // docx / xlsx 是 OOXML，浏览器和对象存储有时标成 application/zip，仍按文档阅读。
  if (extension === '.docx' || mime === DOCX_MIME) return 'docx'
  if (extension === '.xlsx' || mime === XLSX_MIME) return 'xlsx'
  if (ARCHIVE_EXTENSIONS.has(extension) || ARCHIVE_MIMES.has(mime)) return 'archive'
  if (
    mime.startsWith('image/') ||
    extension === '.jpg' ||
    extension === '.jpeg' ||
    extension === '.png' ||
    extension === '.gif' ||
    extension === '.webp'
  ) {
    return 'image'
  }
  if (extension === '.doc' || extension === '.xls' || mime === WORD_MIME || mime === EXCEL_MIME) {
    return 'legacy'
  }
  if (mime.startsWith('text/') || extension === '.txt' || extension === '.csv') return 'text'
  return 'unsupported'
}

export function toUploadPath(fileId: string, name: string) {
  return `${CHAT_UPLOAD_DIR}/${fileId}${CHAT_FILE_PATH_SEPARATOR}${sanitizeChatFileName(name)}`
}

export function toExportPath(fileId: string, name: string) {
  return `${CHAT_EXPORT_DIR}/${fileId}${CHAT_FILE_PATH_SEPARATOR}${sanitizeChatFileName(name)}`
}

export function parseUploadPath(path: string) {
  const matched = UPLOAD_PATH.exec(path)
  if (!matched?.[1] || !matched[2]) return undefined
  return { fileId: matched[1], name: matched[2] }
}

export function parseExportPath(path: string) {
  const matched = EXPORT_PATH.exec(path)
  if (!matched?.[1] || !matched[2]) return undefined
  return { fileId: matched[1], name: matched[2] }
}

export function exportNameFromWritePath(path: string) {
  const exported = parseExportPath(path)
  if (exported) return exported.name
  if (!path.startsWith(`${CHAT_EXPORT_DIR}/`)) return undefined
  const name = path.slice(CHAT_EXPORT_DIR.length + 1)
  if (!name || name.includes('/')) return undefined
  return sanitizeChatFileName(name)
}

export function formatAttachmentManifest(files: readonly ChatAttachmentRef[]) {
  const lines = files.map((file) => toUploadPath(file.fileId, file.name))
  return `<${CHAT_ATTACHMENT_MANIFEST_TAG}>\n${lines.join('\n')}\n</${CHAT_ATTACHMENT_MANIFEST_TAG}>`
}

export function buildChatUserContent(
  text: string,
  files: readonly ChatAttachmentRef[]
): string | ChatUserContentPart[] {
  const visible = text.trim()
  if (files.length === 0) return visible
  const parts: ChatUserContentPart[] = []
  if (visible) parts.push({ type: 'text', text: visible })
  parts.push({ type: 'text', text: formatAttachmentManifest(files) })
  for (const file of files) {
    parts.push({
      type: 'binary',
      mimeType: file.mimeType,
      id: file.fileId,
      filename: file.name
    })
  }
  return parts
}

export function visibleChatText(content: unknown) {
  return collectText(content)
    .map((text) => text.replace(MANIFEST_BLOCK, ''))
    .join('\n')
    .trim()
}

export function listChatAttachments(content: unknown): ChatAttachmentRef[] {
  const byId = new Map<string, ChatAttachmentRef>()
  visitContent(content, (value) => {
    collectBinary(value, byId)
    for (const text of collectText(value)) {
      for (const line of text.split('\n')) {
        const parsed = parseUploadPath(line.trim())
        if (!parsed || byId.has(parsed.fileId)) continue
        byId.set(parsed.fileId, {
          fileId: parsed.fileId,
          name: parsed.name,
          mimeType:
            resolveChatAttachmentMime({ name: parsed.name, type: '' }) ??
            'application/octet-stream',
          size: 0
        })
      }
    }
  })
  return [...byId.values()]
}

export function listChatExports(content: unknown) {
  const found = new Map<string, { fileId: string; name: string }>()
  const text = collectText(content).join('\n')
  for (const matched of text.matchAll(EXPORT_PATH_GLOBAL)) {
    const fileId = matched[1]
    const name = matched[2]
    if (!fileId || !name || found.has(fileId)) continue
    found.set(fileId, { fileId, name })
  }
  return [...found.values()]
}

function collectBinary(value: unknown, byId: Map<string, ChatAttachmentRef>) {
  if (!isRecord(value) || value.type !== 'binary' || typeof value.id !== 'string') return
  const name = typeof value.filename === 'string' && value.filename ? value.filename : 'file'
  byId.set(value.id, {
    fileId: value.id,
    name,
    mimeType: typeof value.mimeType === 'string' ? value.mimeType : 'application/octet-stream',
    size: 0
  })
}

function collectText(content: unknown): string[] {
  if (typeof content === 'string') return [content]
  if (Array.isArray(content)) return content.flatMap((part) => collectText(part))
  if (!isRecord(content)) return []
  if (typeof content.text === 'string' && (content.type === 'text' || content.type === undefined)) {
    return [content.text]
  }
  if (typeof content.content === 'string' || Array.isArray(content.content)) {
    return collectText(content.content)
  }
  return []
}

function visitContent(content: unknown, visit: (value: unknown) => void) {
  visit(content)
  if (Array.isArray(content)) {
    for (const part of content) visitContent(part, visit)
    return
  }
  if (!isRecord(content)) return
  if ('content' in content) visitContent(content.content, visit)
  const kwargs = content.kwargs
  if (isRecord(kwargs) && 'content' in kwargs) visitContent(kwargs.content, visit)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
