import { ItemGroup } from '@zen/ui'
import { Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { UploadFileRow } from '@/components/upload-file-row'
import { digestFileSha256, uploadWithIntent } from '@/lib/storage-upload'

import type { FileAsset, FilePurpose } from '@zen/shared'
import type { ChangeEvent, DragEvent } from 'react'
import type { UploadItem } from '@/components/upload-file-row'
import type { UploadEndpoint } from '@/lib/storage-upload'

type FileUploaderProps = {
  purpose: Exclude<FilePurpose, 'legacy'>
  endpoint?: UploadEndpoint
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onSuccess?: (file: FileAsset, outcome: { deduplicated: boolean }) => void
  onError?: (error: Error) => void
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

  const runUpload = async (id: string, file: File, checksum: string) => {
    const controller = new AbortController()
    controllers.current.set(id, controller)
    updateItem(id, { status: 'uploading', percent: 0, error: undefined })
    try {
      const uploaded = await uploadWithIntent({
        file,
        purpose,
        endpoint,
        checksum,
        signal: controller.signal,
        onProgress: (percent) => updateItem(id, { percent })
      })
      updateItem(id, {
        percent: 100,
        status: uploaded.deduplicated ? 'duplicate' : 'done'
      })
      onSuccess?.(uploaded.file, { deduplicated: uploaded.deduplicated })
      return uploaded.deduplicated ? 'duplicate' : 'done'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        updateItem(id, { status: 'cancelled', error: '已取消' })
        return 'cancelled'
      }
      const next = error instanceof Error ? error : new Error('上传失败')
      updateItem(id, { status: 'error', error: next.message })
      onError?.(next)
      return 'error'
    } finally {
      controllers.current.delete(id)
    }
  }

  const hashItem = async (item: UploadItem) => {
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    try {
      return await digestFileSha256(item.file, controller.signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        updateItem(item.id, { status: 'cancelled', error: '已取消' })
        return null
      }
      const next = error instanceof Error ? error : new Error('无法校验文件')
      updateItem(item.id, { status: 'error', error: next.message })
      onError?.(next)
      return null
    } finally {
      controllers.current.delete(item.id)
    }
  }

  const uploadGroup = async (checksum: string, group: UploadItem[]) => {
    let represented = false
    for (const item of group) {
      if (represented) {
        updateItem(item.id, { status: 'duplicate', percent: 100 })
        continue
      }
      const result = await runUpload(item.id, item.file, checksum)
      if (result === 'done' || result === 'duplicate') represented = true
    }
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const selected = Array.from(fileList)
    const nextItems = selected.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      percent: 0,
      status: 'hashing' as const,
      file
    }))
    setItems((current) => [...nextItems, ...current])
    void (async () => {
      const groups = new Map<string, UploadItem[]>()
      for (const item of nextItems) {
        const checksum = await hashItem(item)
        if (!checksum) continue
        const group = groups.get(checksum)
        if (group) group.push(item)
        else groups.set(checksum, [item])
      }
      await Promise.all(
        [...groups.entries()].map(([checksum, group]) => uploadGroup(checksum, group))
      )
    })()
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
                  updateItem(item.id, { status: 'hashing', percent: 0, error: undefined })
                  void (async () => {
                    const checksum = await hashItem(item)
                    if (!checksum) return
                    await uploadGroup(checksum, [item])
                  })()
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
