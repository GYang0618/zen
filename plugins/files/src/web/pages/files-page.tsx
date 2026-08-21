import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatFromNow } from '@zen/shared'
import { Button, Skeleton } from '@zen/ui'
import { Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'

import { createFilesApi, FILE_PERMISSIONS } from '../api'

import type { FilesRequest } from '../api'

export interface FilesPageProps {
  request: FilesRequest
  can: (permission: string) => boolean
}

const QUERY_KEY = ['files'] as const

export function FilesPage({ request, can }: FilesPageProps) {
  const api = createFilesApi(request)
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.list()
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return
    for (const file of Array.from(files)) {
      uploadMutation.mutate(file)
    }
    event.target.value = ''
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">文件管理</h1>
          <p className="text-sm text-muted-foreground">
            能力插件 files：文件上传、元数据管理与软删除
          </p>
        </div>
        {can(FILE_PERMISSIONS.MANAGE) ? (
          <Button
            type="button"
            disabled={uploadMutation.isPending}
            onClick={handleFileSelect}
          >
            <Upload className="size-4" />
            {uploadMutation.isPending ? '上传中…' : '上传文件'}
          </Button>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-label="选择文件"
      />

      {listQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {listQuery.isError ? (
        <p className="text-sm text-destructive">加载失败，请确认插件已启用且具备权限。</p>
      ) : null}

      <ul className="space-y-2">
        {(listQuery.data ?? []).map((file) => (
          <li
            key={file.id}
            className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium hover:underline"
              >
                {file.filename}
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                {file.mimeType ?? '未知类型'} · {formatFileSize(file.size)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                创建于 {formatFromNow(file.createdAt)}
              </p>
            </div>
            {can(FILE_PERMISSIONS.MANAGE) ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="删除文件"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(file.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {!listQuery.isLoading && (listQuery.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">暂无文件</p>
      ) : null}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** i
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
