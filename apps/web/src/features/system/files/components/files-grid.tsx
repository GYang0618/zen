import { PermissionCode } from '@zen/shared'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Skeleton
} from '@zen/ui'
import {
  Download,
  FileArchive,
  FileText,
  Film,
  Image,
  MoreHorizontal,
  Play,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { canAccess } from '@/lib/auth/permissions'

import { downloadFile } from '../download-file'
import { useFiles } from '../files-provider'
import { useFileUrlQuery } from '../queries'
import {
  CATEGORY_LABEL,
  firstFrameTime,
  formatFileFormat,
  formatFileSize,
  STATUS_LABEL
} from '../utils'

import type { FileAsset, FileCategory, FileStatus } from '@zen/shared'
import type { ReactNode, SyntheticEvent } from 'react'

const CATEGORY_ICON: Record<FileCategory, typeof Image> = {
  image: Image,
  video: Film,
  document: FileText,
  archive: FileArchive,
  other: FileText
}

const FILE_GRID_CLASS_NAME =
  'grid grid-cols-1 gap-3 @xs:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5'

type FilesGridProps = {
  data: FileAsset[]
  isLoading: boolean
  onPreview: (file: FileAsset) => void
}

export function FilesGrid({ data, isLoading, onPreview }: FilesGridProps) {
  const canRead = canAccess([PermissionCode.FILE_READ])
  const canDelete = canAccess([PermissionCode.FILE_DELETE])
  const canRestore = canAccess([PermissionCode.FILE_RESTORE])
  const canPurge = canAccess([PermissionCode.FILE_PURGE])
  const { setOpen, setCurrentRow } = useFiles()

  if (isLoading) {
    return (
      <div className="@container">
        <div className={FILE_GRID_CLASS_NAME}>
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
        </div>
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
    <div className="@container">
      <ul className={FILE_GRID_CLASS_NAME}>
        {data.map((file) => (
          <li key={file.id} className="min-w-0">
            <FileAttachment
              file={file}
              canRead={canRead}
              canDelete={canDelete}
              canRestore={canRestore}
              canPurge={canPurge}
              onPreview={onPreview}
              onDelete={(currentFile) => {
                setCurrentRow(currentFile)
                setOpen('delete')
              }}
              onRestore={(currentFile) => {
                setCurrentRow(currentFile)
                setOpen('restore')
              }}
              onPurge={(currentFile) => {
                setCurrentRow(currentFile)
                setOpen('purge')
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

type FileAttachmentProps = {
  file: FileAsset
  canRead: boolean
  canDelete: boolean
  canRestore: boolean
  canPurge: boolean
  onPreview: (file: FileAsset) => void
  onDelete: (file: FileAsset) => void
  onRestore: (file: FileAsset) => void
  onPurge: (file: FileAsset) => void
}

function FileAttachment({
  file,
  canRead,
  canDelete,
  canRestore,
  canPurge,
  onPreview,
  onDelete,
  onRestore,
  onPurge
}: FileAttachmentProps) {
  const status = file.status
  const canPreview = canRead && status === 'ready'

  return (
    <Attachment
      orientation="vertical"
      state={attachmentState(status)}
      className="h-full w-full! rounded-lg"
    >
      <AttachmentMedia variant="image">
        <FileThumb file={file} canRead={canRead} />
      </AttachmentMedia>
      <AttachmentContent>
        <div className="flex min-w-0 items-center gap-2">
          <AttachmentTitle className="flex-1">{file.originalName}</AttachmentTitle>
          <Badge variant={status === 'deleted' ? 'outline' : 'secondary'}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
          <AttachmentDescription className="mt-0 flex-1">
            {formatFileFormat(file)} · {formatFileSize(file.size)}
          </AttachmentDescription>
          <FileActionsMenu
            file={file}
            canRead={canRead}
            canDelete={canDelete}
            canRestore={canRestore}
            canPurge={canPurge}
            onDelete={onDelete}
            onRestore={onRestore}
            onPurge={onPurge}
          />
        </div>
      </AttachmentContent>
      {canPreview ? (
        <AttachmentTrigger
          aria-label={`预览 ${file.originalName}`}
          onClick={() => onPreview(file)}
        />
      ) : null}
    </Attachment>
  )
}

type FileActionsMenuProps = Pick<FileAttachmentProps, 'onDelete' | 'onRestore' | 'onPurge'> & {
  file: FileAsset
  canRead: boolean
  canDelete: boolean
  canRestore: boolean
  canPurge: boolean
}

function FileActionsMenu({
  file,
  canRead,
  canDelete,
  canRestore,
  canPurge,
  onDelete,
  onRestore,
  onPurge
}: FileActionsMenuProps) {
  const canDownload = file.status === 'ready' && canRead
  const canTrash = file.status !== 'deleted' && file.status !== 'purged' && canDelete
  const canRecover = file.status === 'deleted' && canRestore
  const canPermanentlyDelete = file.status === 'deleted' && canPurge

  if (!canDownload && !canTrash && !canRecover && !canPermanentlyDelete) return null

  return (
    <div className="relative z-20 shrink-0">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`打开 ${file.originalName} 的操作菜单`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {canDownload ? (
            <DropdownMenuItem onClick={() => void downloadFile(file)}>
              下载
              <DropdownMenuShortcut>
                <Download />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canDownload && canTrash ? <DropdownMenuSeparator /> : null}
          {canTrash ? (
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(file)}>
              移入回收站
              <DropdownMenuShortcut>
                <Trash2 />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canRecover ? (
            <DropdownMenuItem onClick={() => onRestore(file)}>
              恢复
              <DropdownMenuShortcut>
                <RotateCcw />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          {canRecover && canPermanentlyDelete ? <DropdownMenuSeparator /> : null}
          {canPermanentlyDelete ? (
            <DropdownMenuItem variant="destructive" onClick={() => onPurge(file)}>
              彻底删除
              <DropdownMenuShortcut>
                <Trash2 />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function attachmentState(status: FileStatus) {
  if (status === 'pending') return 'idle'
  if (status === 'uploaded') return 'processing'
  if (status === 'quarantined') return 'error'
  return 'done'
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

function FileThumb({ file, canRead }: { file: FileAsset; canRead: boolean }) {
  const showImage = canRead && file.category === 'image' && file.status === 'ready'
  const showVideo = canRead && file.category === 'video' && file.status === 'ready'
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
