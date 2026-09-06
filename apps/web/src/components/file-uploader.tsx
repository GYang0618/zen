import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress
} from '@zen/ui'
import { FileArchive, FileText, Film, Image, Loader2, Upload, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { uploadWithIntent } from '@/lib/storage-upload'

import type { FileAsset, FilePurpose } from '@zen/shared'
import type { ChangeEvent, DragEvent } from 'react'
import type { UploadEndpoint } from '@/lib/storage-upload'

type FileUploaderProps = {
  purpose: Exclude<FilePurpose, 'legacy'>
  endpoint?: UploadEndpoint
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onSuccess?: (file: FileAsset) => void
  onError?: (error: Error) => void
}

type UploadStatus = 'uploading' | 'done' | 'error' | 'cancelled'

type UploadItem = {
  id: string
  name: string
  percent: number
  status: UploadStatus
  error?: string
  file: File
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

function FileKindIcon({ file }: { file: File }) {
  const type = file.type
  if (type.startsWith('image/')) return <Image aria-hidden />
  if (type.startsWith('video/')) return <Film aria-hidden />
  if (type.includes('zip') || type.includes('compressed') || /\.(zip|rar|7z)$/i.test(file.name)) {
    return <FileArchive aria-hidden />
  }
  return <FileText aria-hidden />
}

function statusCopy(item: UploadItem) {
  if (item.status === 'uploading') return `${item.percent}%`
  if (item.status === 'done') return '上传完成'
  if (item.status === 'cancelled') return '已取消'
  return item.error ?? '上传失败'
}

function UploadFileActions({
  item,
  onCancel,
  onRetry,
  onDismiss
}: {
  item: UploadItem
  onCancel: () => void
  onRetry: () => void
  onDismiss: () => void
}) {
  return (
    <ItemActions className="shrink-0">
      {item.status === 'uploading' ? (
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
      ) : null}
      {item.status === 'error' ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          重试
        </Button>
      ) : null}
      {item.status === 'done' ? <Badge variant="secondary">完成</Badge> : null}
      {item.status === 'cancelled' ? <Badge variant="outline">已取消</Badge> : null}
      {item.status === 'error' ? <Badge variant="destructive">失败</Badge> : null}
      {item.status !== 'uploading' ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`移除 ${item.name}`}
          onClick={onDismiss}
        >
          <X />
        </Button>
      ) : null}
    </ItemActions>
  )
}

function UploadFileRow({
  item,
  onCancel,
  onRetry,
  onDismiss
}: {
  item: UploadItem
  onCancel: () => void
  onRetry: () => void
  onDismiss: () => void
}) {
  const isUploading = item.status === 'uploading'

  return (
    <Item variant="outline" size="sm" role="listitem" className="min-w-0">
      <ItemMedia variant="icon">
        {isUploading ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <FileKindIcon file={item.file} />
        )}
      </ItemMedia>
      <ItemContent className="min-w-0 overflow-hidden">
        <ItemTitle className="w-full min-w-0">
          <span className="block truncate" title={item.name}>
            {item.name}
          </span>
        </ItemTitle>
        <ItemDescription>
          {formatFileSize(item.file.size)}
          <span aria-hidden> · </span>
          {statusCopy(item)}
        </ItemDescription>
      </ItemContent>
      <UploadFileActions item={item} onCancel={onCancel} onRetry={onRetry} onDismiss={onDismiss} />
      {isUploading ? (
        <ItemFooter>
          <Progress value={item.percent} className="min-w-0" aria-label={`${item.name} 上传进度`} />
        </ItemFooter>
      ) : null}
    </Item>
  )
}

export function FileUploader({
  purpose,
  endpoint,
  accept,
  multiple = false,
  disabled = false,
  onSuccess,
  onError
}: FileUploaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const controllers = useRef(new Map<string, AbortController>())
  const [items, setItems] = useState<UploadItem[]>([])

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const dismissItem = (id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const runUpload = async (id: string, file: File) => {
    const controller = new AbortController()
    controllers.current.set(id, controller)
    try {
      const uploaded = await uploadWithIntent({
        file,
        purpose,
        endpoint,
        signal: controller.signal,
        onProgress: (percent) => updateItem(id, { percent })
      })
      updateItem(id, { percent: 100, status: 'done' })
      onSuccess?.(uploaded)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        updateItem(id, { status: 'cancelled', error: '已取消' })
        return
      }
      const next = error instanceof Error ? error : new Error('上传失败')
      updateItem(id, { status: 'error', error: next.message })
      onError?.(next)
    } finally {
      controllers.current.delete(id)
    }
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const selected = Array.from(fileList)
    const nextItems = selected.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      percent: 0,
      status: 'uploading' as const,
      file
    }))
    setItems((current) => [...nextItems, ...current])
    for (const item of nextItems) {
      void runUpload(item.id, item.file)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled) return
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        aria-label="选择要上传的文件"
        onChange={handleChange}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground"
        aria-label="选择或拖拽要上传的文件"
      >
        <Upload className="size-5" aria-hidden />
        <span>拖拽文件到此处，或点击选择</span>
      </div>

      {items.length > 0 ? (
        <div className="max-h-72 min-w-0 overflow-y-auto">
          <ItemGroup className="gap-2" aria-live="polite">
            {items.map((item) => (
              <UploadFileRow
                key={item.id}
                item={item}
                onCancel={() => controllers.current.get(item.id)?.abort()}
                onRetry={() => {
                  updateItem(item.id, { status: 'uploading', percent: 0, error: undefined })
                  void runUpload(item.id, item.file)
                }}
                onDismiss={() => dismissItem(item.id)}
              />
            ))}
          </ItemGroup>
        </div>
      ) : null}
    </div>
  )
}
