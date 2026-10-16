import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
  Progress
} from '@zen/ui'
import { FileArchive, FileText, Film, Image, Loader2, X } from 'lucide-react'

export type UploadStatus = 'hashing' | 'uploading' | 'done' | 'duplicate' | 'error' | 'cancelled'

export type UploadItem = {
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
  if (item.status === 'hashing') return '正在校验'
  if (item.status === 'uploading') return `${item.percent}%`
  if (item.status === 'done') return '上传完成'
  if (item.status === 'duplicate') return '文件已存在，已跳过'
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
  const isBusy = item.status === 'uploading' || item.status === 'hashing'

  return (
    <ItemActions className="shrink-0">
      {isBusy ? (
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
      {item.status === 'duplicate' ? <Badge variant="outline">已存在</Badge> : null}
      {item.status === 'cancelled' ? <Badge variant="outline">已取消</Badge> : null}
      {item.status === 'error' ? <Badge variant="destructive">失败</Badge> : null}
      {isBusy ? null : (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`移除 ${item.name}`}
          onClick={onDismiss}
        >
          <X />
        </Button>
      )}
    </ItemActions>
  )
}

export function UploadFileRow({
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
  const isBusy = item.status === 'uploading' || item.status === 'hashing'

  return (
    <Item variant="outline" size="sm" role="listitem" className="min-w-0">
      <ItemMedia variant="icon">
        {isBusy ? (
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
      {item.status === 'uploading' ? (
        <ItemFooter>
          <Progress value={item.percent} className="min-w-0" aria-label={`${item.name} 上传进度`} />
        </ItemFooter>
      ) : null}
    </Item>
  )
}
