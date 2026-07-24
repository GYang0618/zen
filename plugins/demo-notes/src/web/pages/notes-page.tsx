import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Skeleton, Textarea } from '@zen/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { createNotesApi, DEMO_NOTE_PERMISSIONS } from '../api'

import type { NotesRequest } from '../api'

export interface NotesPageProps {
  request: NotesRequest
  /** 权限判断：返回 true 表示可见 */
  can: (permission: string) => boolean
}

const QUERY_KEY = ['demo', 'notes'] as const

export function NotesPage({ request, can }: NotesPageProps) {
  const api = createNotesApi(request)
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.list()
  })

  const createMutation = useMutation({
    mutationFn: () => api.create({ title: title.trim(), content: content.trim() || undefined }),
    onSuccess: async () => {
      setTitle('')
      setContent('')
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
          <h1 className="text-xl font-semibold tracking-tight">演示便签</h1>
          <p className="text-sm text-muted-foreground">
            参考插件 demo-notes：CRUD + DataScope + 启停
          </p>
        </div>
        {can(DEMO_NOTE_PERMISSIONS.CREATE) ? (
          <Button
            type="button"
            disabled={!title.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="size-4" />
            新建
          </Button>
        ) : null}
      </div>

      {can(DEMO_NOTE_PERMISSIONS.CREATE) ? (
        <div className="grid gap-2 rounded-lg border p-3">
          <Input
            placeholder="标题"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="便签标题"
          />
          <Textarea
            placeholder="内容（可选）"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            aria-label="便签内容"
            rows={3}
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
        {(listQuery.data ?? []).map((note) => (
          <li
            key={note.id}
            className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{note.title}</div>
              {note.content ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.content}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                更新于 {new Date(note.updatedAt).toLocaleString()}
              </p>
            </div>
            {can(DEMO_NOTE_PERMISSIONS.DELETE) ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="删除便签"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(note.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {!listQuery.isLoading && (listQuery.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">暂无便签</p>
      ) : null}
    </div>
  )
}
