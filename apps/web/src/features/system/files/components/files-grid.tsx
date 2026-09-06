import { PermissionCode } from '@zen/shared'
import { Badge, Button, Skeleton } from '@zen/ui'
import { FileArchive, FileText, Film, Image, Play } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { canAccess } from '@/lib/auth/permissions'

import { useFileUrlQuery } from '../queries'
import { CATEGORY_LABEL, firstFrameTime, formatFileSize, STATUS_LABEL } from '../utils'

import type { FileAsset, FileCategory } from '@zen/shared'
import type { ReactNode, SyntheticEvent } from 'react'

const CATEGORY_ICON: Record<FileCategory, typeof Image> = {
  image: Image,
  video: Film,
  document: FileText,
  archive: FileArchive,
  other: FileText
}

type FilesGridProps = {
  data: FileAsset[]
  isLoading: boolean
  onPreview: (file: FileAsset) => void
}

export function FilesGrid({ data, isLoading, onPreview }: FilesGridProps) {
  const canPreview = canAccess([PermissionCode.FILE_READ])
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="aspect-square w-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="暂无文件"
        description="上传后将按图片、视频、文档、压缩包分类显示"
        compact
      />
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {data.map((file) => (
        <li key={file.id}>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full flex-col items-stretch gap-2 p-2"
            onClick={() => canPreview && onPreview(file)}
          >
            <FileThumb file={file} />
            <span className="w-full truncate text-left text-sm font-medium">
              {file.originalName}
            </span>
            <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {formatFileSize(file.size)}
              <Badge variant={file.status === 'deleted' ? 'outline' : 'secondary'}>
                {STATUS_LABEL[file.status]}
              </Badge>
            </span>
          </Button>
        </li>
      ))}
    </ul>
  )
}

function ThumbFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
      {children}
    </div>
  )
}

function PlayOverlay() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/20">
      <span className="flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground ring-1 ring-foreground/10">
        <Play className="size-5 fill-current" aria-hidden />
      </span>
    </span>
  )
}

function seekToFirstFrame(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget
  const next = firstFrameTime(video.duration)
  if (Math.abs(video.currentTime - next) < 0.001) return
  video.currentTime = next
}

function VideoPoster({ url, label }: { url: string; label: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <ThumbFrame>
      {failed ? (
        <span className="flex size-full items-center justify-center text-muted-foreground">
          <Film className="size-8" aria-hidden />
        </span>
      ) : (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="pointer-events-none size-full object-cover"
          onLoadedMetadata={seekToFirstFrame}
          onLoadedData={seekToFirstFrame}
          onError={() => setFailed(true)}
          aria-hidden
          tabIndex={-1}
        />
      )}
      <PlayOverlay />
      <span className="sr-only">{label}</span>
    </ThumbFrame>
  )
}

function FileThumb({ file }: { file: FileAsset }) {
  const showImage = file.category === 'image' && file.status === 'ready'
  const showVideo = file.category === 'video' && file.status === 'ready'
  const { data, isError } = useFileUrlQuery(file.id, 'inline', showImage || showVideo)
  const Icon = CATEGORY_ICON[file.category]

  if (showImage && data?.url) {
    return (
      <ThumbFrame>
        <img src={data.url} alt="" className="size-full object-cover" />
      </ThumbFrame>
    )
  }

  if (showVideo && data?.url && !isError) {
    return <VideoPoster url={data.url} label={CATEGORY_LABEL.video} />
  }

  return (
    <ThumbFrame>
      <span className="flex size-full items-center justify-center text-muted-foreground">
        <Icon className="size-8" aria-hidden />
        <span className="sr-only">{CATEGORY_LABEL[file.category]}</span>
      </span>
      {file.category === 'video' ? <PlayOverlay /> : null}
    </ThumbFrame>
  )
}
