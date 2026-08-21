import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatFromNow } from '@zen/shared'
import { Button, Input, Skeleton, Textarea } from '@zen/ui'
import { Check, Plus } from 'lucide-react'
import { useState } from 'react'

import { createNotificationsApi, NOTIF_PERMISSIONS } from '../api'

import type { NotificationsRequest } from '../api'

export interface NotificationsPageProps {
  request: NotificationsRequest
  /** 权限判断：返回 true 表示可见 */
  can: (permission: string) => boolean
}

const QUERY_KEY = ['notifications'] as const

export function NotificationsPage({ request, can }: NotificationsPageProps) {
  const api = createNotificationsApi(request)
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.list()
  })

  const createMutation = useMutation({
    mutationFn: () => api.create({ title: title.trim(), body: body.trim() || undefined }),
    onSuccess: async () => {
      setTitle('')
      setBody('')
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">通知中心</h1>
          <p className="text-sm text-muted-foreground">
            能力插件 notifications：站内消息与已读状态
          </p>
        </div>
        {can(NOTIF_PERMISSIONS.MANAGE) ? (
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

      {can(NOTIF_PERMISSIONS.MANAGE) ? (
        <div className="grid gap-2 rounded-lg border p-3">
          <Input
            placeholder="标题"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="通知标题"
          />
          <Textarea
            placeholder="内容（可选）"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-label="通知内容"
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
        {(listQuery.data ?? []).map((notification) => (
          <li
            key={notification.id}
            className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{notification.title}</span>
                {!notification.readAt ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    未读
                  </span>
                ) : null}
              </div>
              {notification.body ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {notification.body}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                创建于 {formatFromNow(notification.createdAt)}
              </p>
            </div>
            {!notification.readAt ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="标记已读"
                disabled={markReadMutation.isPending}
                onClick={() => markReadMutation.mutate(notification.id)}
              >
                <Check className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {!listQuery.isLoading && (listQuery.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">暂无通知</p>
      ) : null}
    </div>
  )
}
