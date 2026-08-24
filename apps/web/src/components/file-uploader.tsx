import { Button, Progress } from '@zen/ui'
import { Loader2, Upload } from 'lucide-react'
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

type UploadItem = {
  id: string
  name: string
  percent: number
  status: 'uploading' | 'done' | 'error' | 'cancelled'
  error?: string
  file: File
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
    <div className="flex flex-col gap-3">
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
        <ul className="flex flex-col gap-2" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{item.name}</span>
                {item.status === 'uploading' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => controllers.current.get(item.id)?.abort()}
                  >
                    取消
                  </Button>
                ) : null}
                {item.status === 'error' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateItem(item.id, { status: 'uploading', percent: 0, error: undefined })
                      void runUpload(item.id, item.file)
                    }}
                  >
                    重试
                  </Button>
                ) : null}
              </div>
              <Progress value={item.percent} aria-label={`${item.name} 上传进度`} />
              <p className="mt-1 text-xs text-muted-foreground">
                {item.status === 'uploading' ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    {item.percent}%
                  </span>
                ) : null}
                {item.status === 'done' ? '上传完成' : null}
                {item.status === 'cancelled' ? '已取消' : null}
                {item.status === 'error' ? item.error : null}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
