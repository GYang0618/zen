import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Skeleton } from '@zen/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { createFilesApi, FILE_PERMISSIONS } from '../api'

import type { FilesRequest } from '../api'

export interface FilesPageProps {
  request: FilesRequest
  /** 权限判断：返回 true 表示可见 */
  can: (permission: string) => boolean
}

const QUERY_KEY = ['files'] as const

export function FilesPage({ request, can }: FilesPageProps) {
  const api = createFilesApi(request)
  const queryClient = useQueryClient()
  const [filename, setFilename] = useState('')

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.list()
  })

  const createMutation = useMutation({
    mutationFn: () => api.create({ filename: filename.trim() }),
    onSuccess: async () => {
      setFilename('')
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">文件管理</h1>
          <p className="text-sm text-muted-foreground">
            能力插件 files：文件对象元数据登记与软删除
          </p>
        </div>
        {can(FILE_PERMISSIONS.MANAGE) ? (
          <Button
            type="button"
            disabled={!filename.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="size-4" />
            新建
          </Button>
        ) : null}
      </div>

      {can(FILE_PERMISSIONS.MANAGE) ? (
        <div className="grid gap-2 rounded-lg border p-3">
          <Input
            placeholder="文件名"
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            aria-label="文件名"
          />
        </div>
      ) : null}

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
              <div className="truncate font-medium">{file.filename}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {file.mimeType ?? '未知类型'} · {file.size} bytes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                创建于 {new Date(file.createdAt).toLocaleString()}
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
