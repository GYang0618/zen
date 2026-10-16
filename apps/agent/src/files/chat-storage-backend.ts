import { getCurrentTaskInput } from '@langchain/langgraph'
import {
  CHAT_EXPORT_DIR,
  CHAT_UPLOAD_DIR,
  chatExportMime,
  chatFileKind,
  exportNameFromWritePath,
  listChatAttachments,
  listChatExports,
  parseExportPath,
  parseUploadPath,
  toExportPath,
  toUploadPath
} from '@zen/shared'

import { IMAGE_READ_NOTICE } from './message-images'
import { createExportDocument, editOfficeText, extractOfficeText } from './office-document'
import { downloadStorageFile, storageErrorMessage, uploadExportFile } from './storage-client'

import type {
  EditResult,
  FileData,
  GlobResult,
  GrepResult,
  LsResult,
  ReadRawResult,
  ReadResult,
  WriteResult
} from 'deepagents'

const GREP_MATCH_LIMIT = 40
const TEXT_MIME = 'text/plain'

type KnownFile = { path: string; fileId: string; name: string }

export const CHAT_FILESYSTEM_TOOL_NAMES = [
  'ls',
  'read_file',
  'write_file',
  'edit_file',
  'glob',
  'grep'
] as const

export class ChatStorageBackend {
  ls(path: string): LsResult {
    const dir = normalizePath(path || '/')
    if (!dir) return { error: '路径必须是绝对路径' }
    if (dir === '/') {
      return {
        files: [
          { path: CHAT_UPLOAD_DIR, is_dir: true },
          { path: CHAT_EXPORT_DIR, is_dir: true }
        ]
      }
    }
    const files = knownFiles().filter((file) => parentDir(file.path) === dir)
    return { files: files.map((file) => ({ path: file.path, is_dir: false })) }
  }

  async read(filePath: string, offset = 0, limit = 100): Promise<ReadResult> {
    const known = resolveKnown(normalizePath(filePath) ?? '')
    if (known && chatFileKind(known.name, '') === 'image') {
      return { content: IMAGE_READ_NOTICE, mimeType: TEXT_MIME }
    }
    const loaded = await loadReadable(filePath)
    if ('error' in loaded) return loaded
    if (loaded.kind === 'image') {
      return { content: IMAGE_READ_NOTICE, mimeType: TEXT_MIME }
    }
    const lines = loaded.text.split('\n')
    return { content: lines.slice(offset, offset + limit).join('\n'), mimeType: TEXT_MIME }
  }

  async readRaw(filePath: string): Promise<ReadRawResult> {
    const loaded = await loadReadable(filePath)
    if ('error' in loaded) return loaded
    const now = new Date().toISOString()
    const data: FileData = {
      content: loaded.kind === 'image' ? loaded.bytes : loaded.text,
      mimeType: loaded.kind === 'image' ? loaded.mimeType : TEXT_MIME,
      created_at: now,
      modified_at: now
    }
    return { data }
  }

  async grep(pattern: string, path?: string | null, glob?: string | null): Promise<GrepResult> {
    let expression: RegExp
    try {
      expression = new RegExp(pattern, 'g')
    } catch {
      return { error: '检索表达式无效' }
    }
    const root = normalizePath(path || '/') ?? '/'
    const matches = []
    for (const file of knownFiles()) {
      if (!file.path.startsWith(root === '/' ? '/' : root)) continue
      if (glob && !matchGlob(file.name, glob)) continue
      const loaded = await loadReadable(file.path)
      if ('error' in loaded || loaded.kind === 'image') continue
      for (const [index, line] of loaded.text.split('\n').entries()) {
        expression.lastIndex = 0
        if (!expression.test(line)) continue
        matches.push({ path: file.path, line: index + 1, text: line })
        if (matches.length >= GREP_MATCH_LIMIT) return { matches }
      }
    }
    return { matches }
  }

  glob(pattern: string, path = '/'): GlobResult {
    const root = normalizePath(path) ?? '/'
    const files = knownFiles()
      .filter((file) => file.path.startsWith(root === '/' ? '/' : root))
      .filter((file) => matchGlob(file.path.slice(root === '/' ? 1 : root.length + 1), pattern))
      .map((file) => ({ path: file.path, is_dir: false as const }))
    return { files }
  }

  async write(filePath: string, content: string): Promise<WriteResult> {
    const name = exportNameFromWritePath(normalizePath(filePath) ?? '')
    const mimeType = name ? chatExportMime(name) : undefined
    if (!name || !mimeType) {
      return { error: '请把结果写到 /exports/文件名，扩展名仅支持 txt、csv、docx、xlsx' }
    }
    try {
      const created = createExportDocument(name, content)
      const asset = await uploadExportFile({ name, mimeType, bytes: created.bytes })
      return {
        path: toExportPath(asset.id, name),
        filesUpdate: null,
        metadata: { fileId: asset.id }
      }
    } catch (error) {
      return { error: storageErrorMessage(error) }
    }
  }

  async edit(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll = false
  ): Promise<EditResult> {
    if (!oldString) return { error: '要替换的原文不能为空' }
    if (oldString === newString) return { error: '新旧内容相同' }
    const source = resolveKnown(normalizePath(filePath) ?? '')
    if (!source) return { error: '只能修改 /uploads 或 /exports 中的已有文件' }
    if (chatFileKind(source.name, '') === 'archive') return { error: '不能修改压缩包' }
    try {
      const downloaded = await downloadStorageFile(source.fileId)
      const kind = chatFileKind(downloaded.asset.originalName, downloaded.asset.mimeType ?? '')
      if (kind === 'archive') return { error: '不能修改压缩包' }
      if (kind === 'image' || kind === 'legacy' || kind === 'unsupported') {
        return { error: '该文件不能按文本修改，请用 write_file 另存一份 txt、csv、docx 或 xlsx' }
      }
      const edited =
        kind === 'text'
          ? editPlainText(downloaded.bytes, oldString, newString, replaceAll)
          : editOfficeText(downloaded.bytes, oldString, newString, replaceAll)
      if ('error' in edited) return { error: edited.error }
      const name = downloaded.asset.originalName
      const mimeType = downloaded.asset.mimeType ?? chatExportMime(name)
      if (!mimeType) return { error: '无法确定导出文件类型' }
      const asset = await uploadExportFile({ name, mimeType, bytes: edited.bytes })
      return {
        path: toExportPath(asset.id, name),
        occurrences: edited.occurrences,
        filesUpdate: null,
        metadata: { fileId: asset.id }
      }
    } catch (error) {
      return { error: storageErrorMessage(error) }
    }
  }
}

async function loadReadable(filePath: string) {
  const source = resolveKnown(normalizePath(filePath) ?? '')
  if (!source) return { error: '文件不存在。请使用 /uploads 或 /exports 下的完整路径' }
  if (chatFileKind(source.name, '') === 'archive') {
    return { error: '不阅读压缩包。请上传压缩包内的文档、表格或图片' }
  }
  try {
    const downloaded = await downloadStorageFile(source.fileId)
    const name = downloaded.asset.originalName
    const mimeType = downloaded.asset.mimeType ?? 'application/octet-stream'
    const kind = chatFileKind(name, mimeType)
    if (kind === 'archive') return { error: '不阅读压缩包。请上传压缩包内的文档、表格或图片' }
    if (kind === 'legacy')
      return { error: '旧版 Word / Excel 无法解析，请另存为 docx 或 xlsx 后重新上传' }
    if (kind === 'unsupported') return { error: '暂不能阅读该文件类型' }
    if (kind === 'image') return { kind, bytes: downloaded.bytes, mimeType }
    const text =
      kind === 'text'
        ? new TextDecoder().decode(downloaded.bytes)
        : extractOfficeText(kind, downloaded.bytes)
    return { kind, text, mimeType }
  } catch (error) {
    return { error: storageErrorMessage(error) }
  }
}

function editPlainText(
  bytes: Uint8Array,
  oldString: string,
  newString: string,
  replaceAll: boolean
) {
  const text = new TextDecoder().decode(bytes)
  const occurrences = replaceAll ? countOf(text, oldString) : text.includes(oldString) ? 1 : 0
  if (occurrences === 0) return { error: '没有找到要替换的原文' }
  const next = replaceAll
    ? text.split(oldString).join(newString)
    : replaceOnce(text, oldString, newString)
  return { bytes: new TextEncoder().encode(next), occurrences }
}

function replaceOnce(text: string, search: string, replacement: string) {
  const index = text.indexOf(search)
  if (index < 0) return text
  return text.slice(0, index) + replacement + text.slice(index + search.length)
}

function knownFiles(): KnownFile[] {
  let messages: unknown[] = []
  try {
    const state = getCurrentTaskInput() as { messages?: unknown[] }
    messages = Array.isArray(state?.messages) ? state.messages : []
  } catch {
    return []
  }
  const files = new Map<string, KnownFile>()
  for (const message of messages) {
    for (const file of listChatAttachments(message)) {
      const path = toUploadPath(file.fileId, file.name)
      const upload = parseUploadPath(path)
      if (!upload) continue
      files.set(upload.fileId, { path, fileId: upload.fileId, name: upload.name })
    }
    for (const file of listChatExports(message)) {
      const path = toExportPath(file.fileId, file.name)
      const exported = parseExportPath(path)
      if (!exported) continue
      files.set(exported.fileId, { path, fileId: exported.fileId, name: exported.name })
    }
  }
  return [...files.values()]
}

function resolveKnown(path: string) {
  return knownFiles().find((file) => file.path === path)
}

function parentDir(path: string) {
  const index = path.lastIndexOf('/')
  return index <= 0 ? '/' : path.slice(0, index)
}

function normalizePath(path: string) {
  if (!path.startsWith('/')) return undefined
  const segments = path.split('/').filter((segment) => segment.length > 0)
  if (segments.includes('..') || segments.includes('~')) return undefined
  return `/${segments.join('/')}`
}

function matchGlob(value: string, pattern: string) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DEEP::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DEEP::/g, '.*')
  return new RegExp(`^${escaped}$`).test(value)
}

function countOf(text: string, needle: string) {
  let count = 0
  let index = 0
  while (index <= text.length) {
    const found = text.indexOf(needle, index)
    if (found < 0) break
    count += 1
    index = found + needle.length
  }
  return count
}
