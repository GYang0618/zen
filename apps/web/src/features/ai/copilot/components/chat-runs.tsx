'use client'

import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'
import { Ban, ChevronDown, FileJson, History, LoaderCircle, RefreshCw, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { defaultAgentRuntimeApi } from '../runtime-api'

import type { AgentArtifact, AgentRunDetail, AgentRunSummary } from '../runtime-api'

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'running', label: '运行中' },
  { value: 'interrupted', label: '待审批' },
  { value: 'succeeded', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'cancelled', label: '已取消' },
  { value: 'timed_out', label: '已超时' }
] as const

interface ChatRunsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  threadId?: string
  onResume: (runId: string) => Promise<void>
  onCancel: (runId: string) => Promise<void>
}

export function ChatRuns({ open, onOpenChange, threadId, onResume, onCancel }: ChatRunsProps) {
  const [status, setStatus] = useState('all')
  const [runs, setRuns] = useState<AgentRunSummary[]>([])
  const [selected, setSelected] = useState<AgentRunDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const loadRuns = useCallback(async () => {
    setLoading(true)
    try {
      const items = await defaultAgentRuntimeApi.listRuns({
        ...(threadId ? { threadId } : {}),
        ...(status !== 'all' ? { status } : {})
      })
      setRuns(items)
      if (selected && !items.some((run) => run.id === selected.id)) setSelected(null)
    } finally {
      setLoading(false)
    }
  }, [selected, status, threadId])

  useEffect(() => {
    if (open) void loadRuns()
  }, [loadRuns, open])

  const selectRun = async (runId: string) => setSelected(await defaultAgentRuntimeApi.getRun(runId))

  const cancelRun = async () => {
    if (!selected) return
    setActing(true)
    try {
      await onCancel(selected.id)
      setSelected(await defaultAgentRuntimeApi.getRun(selected.id))
      await loadRuns()
    } finally {
      setActing(false)
    }
  }

  const resumeRun = async () => {
    if (!selected) return
    setActing(true)
    onOpenChange(false)
    try {
      await onResume(selected.id)
    } finally {
      setActing(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(94vw,46rem)] sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle>运行记录</SheetTitle>
          <SheetDescription>查看 Default Agent 的 Tool、审批和完整结果。</SheetDescription>
        </SheetHeader>
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-b md:border-r md:border-b-0">
            <div className="flex items-center gap-2 border-b p-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger size="sm" className="flex-1">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon-sm" title="刷新" onClick={() => void loadRuns()}>
                <RefreshCw data-icon="inline-start" />
              </Button>
            </div>
            <ScrollArea className="min-h-48 flex-1">
              <div className="flex flex-col gap-1 p-2">
                {loading && runs.length === 0
                  ? Array.from({ length: 4 }, (_, index) => (
                      <Skeleton key={index} className="h-16 w-full" />
                    ))
                  : runs.map((run) => (
                      <button
                        key={run.id}
                        type="button"
                        data-active={selected?.id === run.id || undefined}
                        className="flex min-w-0 flex-col gap-1 rounded-md px-3 py-2 text-left hover:bg-muted data-[active=true]:bg-muted"
                        onClick={() => void selectRun(run.id)}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {formatRunTime(run.createdAt)}
                          </span>
                          <RunStatusBadge status={run.status} />
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {run._count.toolExecutions} 个工具 · {run.inputTokens + run.outputTokens}{' '}
                          tokens
                        </span>
                      </button>
                    ))}
                {!loading && runs.length === 0 && (
                  <Empty className="border-0 py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <History />
                      </EmptyMedia>
                      <EmptyTitle>暂无运行记录</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            </ScrollArea>
          </div>
          <ScrollArea className="min-h-0">
            {selected ? (
              <RunDetail
                run={selected}
                acting={acting}
                onCancel={() => void cancelRun()}
                onResume={() => void resumeRun()}
              />
            ) : (
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <History />
                  </EmptyMedia>
                  <EmptyTitle>选择一次运行</EmptyTitle>
                  <EmptyDescription>可查看时间线、审批和 Artifact。</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function RunDetail({
  run,
  acting,
  onCancel,
  onResume
}: {
  run: AgentRunDetail
  acting: boolean
  onCancel: () => void
  onResume: () => void
}) {
  const canCancel = ['pending', 'running', 'finishing', 'interrupted'].includes(run.status)
  const canResume = ['failed', 'cancelled', 'timed_out', 'interrupted'].includes(run.status)
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RunStatusBadge status={run.status} />
          <span className="text-sm text-muted-foreground">{run.endReason || '运行中'}</span>
        </div>
        <div className="flex items-center gap-2">
          {canResume && (
            <Button size="sm" disabled={acting} onClick={onResume}>
              {acting ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              恢复为新运行
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" size="sm" disabled={acting} onClick={onCancel}>
              <Ban data-icon="inline-start" />
              取消运行
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Metric label="模型调用" value={run.modelCalls} />
        <Metric label="Token" value={run.inputTokens + run.outputTokens} />
        <Metric label="失败次数" value={run.failureCount} />
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="tool-timeline-title">
        <h3 id="tool-timeline-title" className="text-sm font-semibold">
          Tool 时间线
        </h3>
        {run.toolExecutions.length ? (
          <Timeline>
            {run.toolExecutions.map((execution) => (
              <TimelineItem key={execution.id}>
                <TimelineIndicator>
                  <Wrench className="size-4 text-muted-foreground" />
                </TimelineIndicator>
                <TimelineConnector />
                <TimelineContent>
                  <TimelineTitle>{execution.toolName}</TimelineTitle>
                  <TimelineTimestamp>
                    {formatRunTime(execution.startedAt || execution.createdAt)}
                  </TimelineTimestamp>
                  <TimelineDescription>
                    {execution.status}
                    {execution.errorReason ? ` · ${execution.errorReason}` : ''}
                  </TimelineDescription>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        ) : (
          <p className="text-sm text-muted-foreground">本次运行未调用 Tool。</p>
        )}
      </section>
      {run.approvals.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="approval-title">
          <h3 id="approval-title" className="text-sm font-semibold">
            审批记录
          </h3>
          {run.approvals.map((approval) => (
            <div key={approval.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{approval.operation || approval.toolName}</span>
                <Badge variant="outline">{approval.status}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                {approval.impactSummary || approval.targetSummary}
              </p>
            </div>
          ))}
        </section>
      )}
      {run.artifacts.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="artifact-title">
          <h3 id="artifact-title" className="text-sm font-semibold">
            Artifact
          </h3>
          {run.artifacts.map((artifact) => (
            <ArtifactRow key={artifact.id} artifact={artifact} />
          ))}
        </section>
      )}
    </div>
  )
}

function ArtifactRow({ artifact }: { artifact: AgentArtifact }) {
  const [content, setContent] = useState<unknown>()
  const [loading, setLoading] = useState(false)
  const load = async (open: boolean) => {
    if (!open || content !== undefined) return
    setLoading(true)
    try {
      setContent((await defaultAgentRuntimeApi.getArtifact(artifact.id)).content)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Collapsible onOpenChange={(open) => void load(open)}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border p-3 text-left hover:bg-muted/60">
        <FileJson className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{artifact.name}</span>
          <span className="block text-xs text-muted-foreground">{formatBytes(artifact.size)}</span>
        </span>
        <ChevronDown className="size-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function RunStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'failed' || status === 'timed_out'
      ? 'destructive'
      : status === 'succeeded'
        ? 'default'
        : 'secondary'
  return (
    <Badge variant={variant}>
      {STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status}
    </Badge>
  )
}

function formatRunTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}
