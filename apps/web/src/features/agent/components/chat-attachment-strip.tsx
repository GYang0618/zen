'use client'

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle
} from '@zen/ui'
import { FileText, RotateCw, X } from 'lucide-react'

import type { PendingAttachment } from '../hooks/use-chat-attachments'

export function ChatAttachmentStrip({
  items,
  onRemove,
  onRetry
}: {
  items: PendingAttachment[]
  onRemove: (localId: string) => void
  onRetry: (localId: string) => void
}) {
  if (items.length === 0) return null

  return (
    <AttachmentGroup className="px-3 pt-3">
      {items.map((item) => (
        <Attachment
          key={item.localId}
          size="sm"
          state={item.status === 'done' ? 'done' : item.status}
        >
          {item.previewUrl ? (
            <AttachmentMedia variant="image">
              <img src={item.previewUrl} alt="" />
            </AttachmentMedia>
          ) : (
            <AttachmentMedia>
              <FileText />
            </AttachmentMedia>
          )}
          <AttachmentContent>
            <AttachmentTitle title={item.name}>{item.name}</AttachmentTitle>
            <AttachmentDescription>
              {item.status === 'uploading' ? `${item.percent}%` : null}
              {item.status === 'done' ? formatFileSize(item.size) : null}
              {item.status === 'error' ? item.error : null}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            {item.status === 'error' ? (
              <AttachmentAction
                aria-label={`重试 ${item.name}`}
                onClick={() => onRetry(item.localId)}
              >
                <RotateCw />
              </AttachmentAction>
            ) : null}
            <AttachmentAction
              aria-label={`移除 ${item.name}`}
              onClick={() => onRemove(item.localId)}
            >
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}

function formatFileSize(bytes: number) {
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
