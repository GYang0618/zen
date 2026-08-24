import { PermissionCode } from '@zen/shared'
import { Badge, Button, Skeleton } from '@zen/ui'
import { FileArchive, FileText, Film, Image } from 'lucide-react'

import { EmptyState } from '@/components/empty-state'
import { canAccess } from '@/lib/auth/permissions'

import { useFileUrlQuery } from '../queries'
import { CATEGORY_LABEL, formatFileSize, STATUS_LABEL } from '../utils'

import type { FileAsset, FileCategory } from '@zen/shared'

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

function FileThumb({ file }: { file: FileAsset }) {
  const showImage = file.category === 'image' && file.status === 'ready'
  const { data } = useFileUrlQuery(file.id, 'inline', showImage)
  const Icon = CATEGORY_ICON[file.category]

  if (showImage && data?.url) {
    return (
      <img
        src={data.url}
        alt=""
        className="aspect-square w-full rounded-md bg-muted object-cover"
      />
    )
  }

  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Icon className="size-8" aria-hidden />
      <span className="sr-only">{CATEGORY_LABEL[file.category]}</span>
    </div>
  )
}
