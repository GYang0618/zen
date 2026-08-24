import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton
} from '@zen/ui'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import { storageApi } from '../api'
import { useFileUrlQuery } from '../queries'
import { formatFileSize } from '../utils'

import type { FileAsset } from '@zen/shared'

type FilePreviewDialogProps = {
  file: FileAsset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const { data, isLoading, isError } = useFileUrlQuery(file?.id, 'inline', open && Boolean(file))

  const handleDownload = async () => {
    if (!file) return
    try {
      const { url } = await storageApi.getUrl(file.id, 'attachment')
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法下载文件')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{file?.originalName ?? '文件预览'}</DialogTitle>
          <DialogDescription>
            {file ? `${formatFileSize(file.size)} · ${file.mimeType ?? '未知类型'}` : '预览文件'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-48 flex-1 overflow-auto">
          {!file || isLoading ? <Skeleton className="h-64 w-full" /> : null}
          {isError ? (
            <p className="text-sm text-muted-foreground">无法加载预览，请尝试下载。</p>
          ) : null}
          {file && data ? <PreviewBody file={file} url={data.url} /> : null}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => void handleDownload()}>
            <Download data-icon="inline-start" />
            下载
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewBody({ file, url }: { file: FileAsset; url: string }) {
  if (file.category === 'image') {
    return (
      <img
        src={url}
        alt={file.originalName}
        className="mx-auto max-h-[65vh] w-auto max-w-full rounded-md object-contain"
      />
    )
  }
  if (file.category === 'video') {
    return (
      <video
        src={url}
        controls
        className="mx-auto max-h-[65vh] w-full rounded-md bg-black"
        aria-label={file.originalName}
      >
        <track kind="captions" label="未提供字幕" />
        浏览器不支持视频预览
      </video>
    )
  }
  if (file.mimeType === 'application/pdf') {
    return (
      <iframe
        title={file.originalName}
        src={url}
        className="h-[65vh] w-full rounded-md border border-border"
      />
    )
  }
  return (
    <p className="text-sm text-muted-foreground">该类型暂不支持站内预览，请使用下载查看原文。</p>
  )
}
