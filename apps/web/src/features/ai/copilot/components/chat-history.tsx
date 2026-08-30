'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@zen/ui'
import { Archive, MessageSquareText, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { AgentThreadSummary } from '../runtime-api'

interface ChatHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  threads: AgentThreadSummary[]
  currentThreadId: string
  loading: boolean
  onCreate: () => void
  onSelect: (threadId: string) => void
  onArchive: (threadId: string) => void
  onDelete: (threadId: string) => void
}

export function ChatHistory({
  open,
  onOpenChange,
  threads,
  currentThreadId,
  loading,
  onCreate,
  onSelect,
  onArchive,
  onDelete
}: ChatHistoryProps) {
  const [deleteTarget, setDeleteTarget] = useState<AgentThreadSummary | null>(null)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[min(88vw,22rem)] sm:max-w-sm">
          <SheetHeader className="border-b">
            <div className="flex items-center justify-between gap-3 pr-8">
              <SheetTitle>对话历史</SheetTitle>
              <Button size="sm" onClick={onCreate}>
                <Plus data-icon="inline-start" />
                新对话
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-1 p-2">
              {loading && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">正在加载</p>
              )}
              {!loading && threads.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">暂无历史对话</p>
              )}
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="group flex items-center gap-1 rounded-md hover:bg-muted/70"
                  data-active={thread.id === currentThreadId || undefined}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 text-left data-[active=true]:bg-muted"
                    data-active={thread.id === currentThreadId || undefined}
                    onClick={() => onSelect(thread.id)}
                  >
                    <MessageSquareText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {thread.title || '新对话'}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatRelativeTime(thread.updatedAt)} · {thread._count.messages} 条消息
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    title="归档对话"
                    onClick={() => onArchive(thread.id)}
                  >
                    <Archive data-icon="inline-start" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="mr-1 text-destructive opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    title="删除对话"
                    onClick={() => setDeleteTarget(thread)}
                  >
                    <Trash2 data-icon="inline-start" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这段对话？</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.title || '新对话'}”的消息、运行记录和事件将一并删除，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function formatRelativeTime(value: string): string {
  const delta = Date.now() - new Date(value).getTime()
  if (delta < 60_000) return '刚刚'
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} 分钟前`
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} 小时前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(
    new Date(value)
  )
}
