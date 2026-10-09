'use client'

import {
  CHAT_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_MAX_COUNT,
  resolveChatAttachmentMime
} from '@zen/shared'
import { toast } from '@zen/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

import { uploadWithIntent } from '@/lib/storage-upload'

import type { ChatAttachmentRef } from '@zen/shared'

export type PendingAttachment = {
  localId: string
  file: File
  name: string
  mimeType: string
  size: number
  status: 'uploading' | 'done' | 'error'
  percent: number
  error?: string
  fileId?: string
  previewUrl?: string
}

export function useChatAttachments() {
  const inputRef = useRef<HTMLInputElement>(null)
  const controllers = useRef(new Map<string, AbortController>())
  const [items, setItems] = useState<PendingAttachment[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const active = controllers.current
    return () => {
      for (const controller of active.values()) controller.abort()
      for (const item of itemsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      }
    }
  }, [])

  const patch = (localId: string, next: Partial<PendingAttachment>) => {
    setItems((current) =>
      current.map((item) => (item.localId === localId ? { ...item, ...next } : item))
    )
  }

  const uploadOne = async (localId: string, file: File, mimeType: string) => {
    const controller = new AbortController()
    controllers.current.set(localId, controller)
    try {
      const uploaded = await uploadWithIntent({
        file: file.type === mimeType ? file : new File([file], file.name, { type: mimeType }),
        purpose: 'attachment',
        signal: controller.signal,
        onProgress: (percent) => patch(localId, { percent })
      })
      patch(localId, { status: 'done', percent: 100, fileId: uploaded.id, mimeType })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message = error instanceof Error ? error.message : '上传失败'
      patch(localId, { status: 'error', error: message })
    } finally {
      controllers.current.delete(localId)
    }
  }

  const addFiles = (list: FileList | File[]) => {
    const incoming = [...list]
    const room = CHAT_ATTACHMENT_MAX_COUNT - items.length
    if (room <= 0) {
      toast.add({ title: `最多添加 ${CHAT_ATTACHMENT_MAX_COUNT} 个文件`, type: 'error' })
      return
    }
    if (incoming.length > room) {
      toast.add({ title: `最多添加 ${CHAT_ATTACHMENT_MAX_COUNT} 个文件`, type: 'error' })
    }
    const accepted = incoming.slice(0, room).map((file) => createPending(file))
    setItems((current) => [...current, ...accepted])
    for (const item of accepted) {
      if (item.status === 'error') continue
      void uploadOne(item.localId, item.file, item.mimeType)
    }
  }

  const openPicker = () => inputRef.current?.click()

  const onPick = (files: FileList | null) => {
    if (files && files.length > 0) addFiles(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = (localId: string) => {
    controllers.current.get(localId)?.abort()
    controllers.current.delete(localId)
    setItems((current) => {
      const target = current.find((item) => item.localId === localId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return current.filter((item) => item.localId !== localId)
    })
  }

  const retry = (localId: string) => {
    const target = items.find((item) => item.localId === localId)
    if (!target) return
    patch(localId, { status: 'uploading', percent: 0, error: undefined })
    void uploadOne(localId, target.file, target.mimeType)
  }

  const clear = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort()
    controllers.current.clear()
    setItems((current) => {
      for (const item of current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      }
      return []
    })
  }, [])

  const restore = (next: PendingAttachment[]) => {
    setItems(next)
  }

  const ready: ChatAttachmentRef[] = items.flatMap((item) =>
    item.status === 'done' && item.fileId
      ? [{ fileId: item.fileId, name: item.name, mimeType: item.mimeType, size: item.size }]
      : []
  )

  return {
    items,
    accept: CHAT_ATTACHMENT_ACCEPT,
    inputRef,
    uploading: items.some((item) => item.status === 'uploading'),
    ready,
    openPicker,
    onPick,
    remove,
    retry,
    clear,
    restore
  }
}

function createPending(file: File): PendingAttachment {
  const mimeType = resolveChatAttachmentMime(file)
  const localId = crypto.randomUUID()
  const previewUrl = mimeType?.startsWith('image/') ? URL.createObjectURL(file) : undefined
  if (!mimeType) {
    return {
      localId,
      file,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      status: 'error',
      percent: 0,
      error: '仅支持图片、Word、文本和 Excel',
      previewUrl
    }
  }
  return {
    localId,
    file,
    name: file.name,
    mimeType,
    size: file.size,
    status: 'uploading',
    percent: 0,
    previewUrl
  }
}
