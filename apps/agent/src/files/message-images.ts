import { HumanMessage, ToolMessage } from '@langchain/core/messages'
import { chatFileKind, listChatAttachments } from '@zen/shared'

import { downloadStorageFile, storageErrorMessage } from './storage-client'

import type { BaseMessage, ContentBlock } from '@langchain/core/messages'
import type { ChatAttachmentRef } from '@zen/shared'

/** 内联进模型请求的图片上限。再大的图像不会塞进请求体。 */
const IMAGE_INLINE_MAX_BYTES = 10 * 1024 * 1024

export const IMAGE_READ_NOTICE =
  '这是图片。图像已经附在用户消息中，请直接根据图像回答，不要再次读取。'

/**
 * 把用户消息里仅有文件 ID 的图片换成 data URL。
 * 对话接口只在用户消息中接收图像；工具消息里的图像会被丢弃或撑住后续请求。
 */
export async function hydrateMessageImages(messages: BaseMessage[]): Promise<BaseMessage[]> {
  let changed = false
  const next = await Promise.all(
    messages.map(async (message) => {
      const withoutToolImage = replaceToolImage(message)
      if (withoutToolImage !== message) changed = true
      if (!HumanMessage.isInstance(withoutToolImage)) return withoutToolImage
      const hydrated = await hydrateHuman(withoutToolImage)
      if (hydrated !== withoutToolImage) changed = true
      return hydrated
    })
  )
  return changed ? next : messages
}

function replaceToolImage(message: BaseMessage): BaseMessage {
  if (!ToolMessage.isInstance(message) || !Array.isArray(message.content)) return message
  if (!message.content.some((part) => part.type === 'image' || part.type === 'image_url')) {
    return message
  }
  return new ToolMessage({
    content: IMAGE_READ_NOTICE,
    tool_call_id: message.tool_call_id,
    name: message.name
  })
}

async function hydrateHuman(message: HumanMessage): Promise<HumanMessage> {
  if (!Array.isArray(message.content)) return message
  const byId = new Map(listChatAttachments(message).map((file) => [file.fileId, file]))
  let changed = false
  const content = await Promise.all(
    message.content.map(async (part) => {
      const next = await hydratePart(part, byId)
      if (next !== part) changed = true
      return next
    })
  )
  if (!changed) return message
  return new HumanMessage({
    id: message.id,
    content,
    name: message.name,
    additional_kwargs: message.additional_kwargs
  })
}

async function hydratePart(
  part: ContentBlock,
  byId: ReadonlyMap<string, ChatAttachmentRef>
): Promise<ContentBlock> {
  const fileId = bareFileId(part, byId)
  if (!fileId) return part
  const file = byId.get(fileId)
  if (!file || chatFileKind(file.name, file.mimeType) !== 'image') {
    return { type: 'text', text: '该附件不是图片。请根据消息中的路径阅读文档或表格。' }
  }
  return inlineImage(fileId, file.mimeType)
}

async function inlineImage(fileId: string, fallbackMime: string): Promise<ContentBlock> {
  try {
    const downloaded = await downloadStorageFile(fileId)
    const mimeType = downloaded.asset.mimeType ?? fallbackMime
    if (!mimeType.startsWith('image/')) {
      return { type: 'text', text: '该附件不是图片。请根据消息中的路径阅读文档或表格。' }
    }
    if (downloaded.bytes.byteLength > IMAGE_INLINE_MAX_BYTES) {
      return { type: 'text', text: '图片过大，无法直接查看。请换一张更小的图片。' }
    }
    const data = Buffer.from(downloaded.bytes).toString('base64')
    return { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } }
  } catch (error) {
    return { type: 'text', text: `图片暂时无法查看：${storageErrorMessage(error)}` }
  }
}

function bareFileId(
  part: ContentBlock,
  byId: ReadonlyMap<string, ChatAttachmentRef>
): string | undefined {
  const url = imageUrl(part)
  if (!url || !byId.has(url)) return undefined
  return url
}

function imageUrl(part: ContentBlock): string | undefined {
  if (typeof part !== 'object' || part === null || !('type' in part) || part.type !== 'image_url') {
    return undefined
  }
  if (!('image_url' in part)) return undefined
  const image = part.image_url
  if (typeof image === 'string') return image
  if (image && typeof image === 'object' && 'url' in image && typeof image.url === 'string') {
    return image.url
  }
  return undefined
}
