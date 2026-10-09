'use client'

import { listChatAttachments, listChatExports } from '@zen/shared'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  toast
} from '@zen/ui'
import { Download, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getStorageFileUrl } from '@/lib/storage-api'

import type { ChatAttachmentRef } from '@zen/shared'

export function ChatUserAttachments({ content }: { content: unknown }) {
  const files = listChatAttachments(content)
  if (files.length === 0) return null

  return (
    <AttachmentGroup className="ml-auto max-w-7/10 justify-end">
      {files.map((file) => (
        <UserFileChip key={file.fileId} file={file} />
      ))}
    </AttachmentGroup>
  )
}

export function ChatExportDownloads({ contents }: { contents: unknown[] }) {
  const files = new Map<string, { fileId: string; name: string }>()
  for (const content of contents) {
    for (const file of listChatExports(content)) files.set(file.fileId, file)
  }
  const items = [...files.values()]
  if (items.length === 0) return null

  return (
    <AttachmentGroup className="max-w-xl">
      {items.map((file) => (
        <Attachment key={file.fileId} size="sm">
          <AttachmentMedia>
            <FileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle title={file.name}>{file.name}</AttachmentTitle>
            <AttachmentDescription>可下载</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label={`下载 ${file.name}`}
              onClick={() => downloadExport(file.fileId)}
            >
              <Download />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}

function UserFileChip({ file }: { file: ChatAttachmentRef }) {
  const previewUrl = useImagePreview(file)

  return (
    <Attachment size="sm">
      {previewUrl ? (
        <AttachmentMedia variant="image">
          <img src={previewUrl} alt="" />
        </AttachmentMedia>
      ) : (
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
      )}
      <AttachmentContent>
        <AttachmentTitle title={file.name}>{file.name}</AttachmentTitle>
      </AttachmentContent>
    </Attachment>
  )
}

function useImagePreview(file: ChatAttachmentRef) {
  const [url, setUrl] = useState<string>()
  const isImage = file.mimeType.startsWith('image/')

  useEffect(() => {
    if (!isImage) return
    let cancelled = false
    void getStorageFileUrl(file.fileId, 'inline')
      .then((access) => {
        if (!cancelled) setUrl(access.url)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [file.fileId, isImage])

  return url
}

async function downloadExport(fileId: string) {
  try {
    const { url } = await getStorageFileUrl(fileId, 'attachment')
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    toast.add({ title: error instanceof Error ? error.message : '无法下载文件', type: 'error' })
  }
}
