import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatFromNow } from '@zen/shared'
import { Button, Input, Skeleton } from '@zen/ui'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { createJobsApi, JOB_PERMISSIONS } from '../api.js'

import type { JobsRequest } from '../api.js'

export interface JobsPageProps {
  request: JobsRequest
  /** 权限判断：返回 true 表示可见 */
  can: (permission: string) => boolean
}

const QUERY_KEY = ['jobs'] as const

export function JobsPage({ request, can }: JobsPageProps) {
  const api = createJobsApi(request)
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const listQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.list()
  })

  const createMutation = useMutation({
    mutationFn: () => api.create({ name: name.trim() }),
    onSuccess: async () => {
      setName('')
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">任务中心</h1>
          <p className="text-sm text-muted-foreground">
            能力插件 jobs：同步假执行器，创建后立即完成
          </p>
        </div>
        {can(JOB_PERMISSIONS.MANAGE) ? (
          <Button
            type="button"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="size-4" />
            新建
          </Button>
        ) : null}
      </div>

      {can(JOB_PERMISSIONS.MANAGE) ? (
        <div className="grid gap-2 rounded-lg border p-3">
          <Input
            placeholder="任务名称"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="任务名称"
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
        {(listQuery.data ?? []).map((job) => (
          <li
            key={job.id}
            className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{job.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                创建于 {formatFromNow(job.createdAt)}
              </p>
            </div>
            <span
              className={
                job.status === 'completed'
                  ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600'
                  : job.status === 'failed'
                    ? 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive'
                    : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
              }
            >
              {job.status}
            </span>
          </li>
        ))}
      </ul>

      {!listQuery.isLoading && (listQuery.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">暂无任务</p>
      ) : null}
    </div>
  )
}
