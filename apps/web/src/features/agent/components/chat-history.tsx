'use client'

import { useNavigate } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@zen/ui'
import { useState } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'

import { useAgentChatShellStore } from '../stores/agent-chat-shell'
import { HistoryRow } from './chat-history-row'

import type { AgentThreadSummary } from '../runtime-api'

export { formatRelativeTime } from './chat-history-row'

export function ChatHistory() {
  const threads = useAgentChatShellStore((state) => state.threads)
  const currentThreadId = useAgentChatShellStore((state) => state.currentThreadId)
  const runningThreadId = useAgentChatShellStore((state) => state.runningThreadId)
  const historyLoading = useAgentChatShellStore((state) => state.historyLoading)
  const historyLoadingMore = useAgentChatShellStore((state) => state.historyLoadingMore)
  const historyHasMore = useAgentChatShellStore((state) => state.historyHasMore)
  const historyLoadMoreError = useAgentChatShellStore((state) => state.historyLoadMoreError)
  const handlers = useAgentChatShellStore((state) => state.handlers)
  const setRunsOpen = useAgentChatShellStore((state) => state.setRunsOpen)
  const navigate = useNavigate()

  const [deleteTarget, setDeleteTarget] = useState<AgentThreadSummary | null>(null)
  const [renamingId, setRenamingId] = useState<string>()

  const activeThreads = threads.filter((thread) => thread.status !== 'archived')

  return (
    <>
      {/* w-0 min-w-full：抵消 Radix ScrollArea 内层 display:table，避免长标题把侧栏撑开 */}
      <div className="flex w-0 min-w-full flex-col">
        {historyLoading && activeThreads.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">正在加载</p>
        )}
        {!historyLoading &&
          activeThreads.length === 0 &&
          !historyHasMore &&
          !historyLoadingMore && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">暂无历史对话</p>
          )}
        <div className="flex min-w-0 flex-col gap-1 overflow-hidden">
          {activeThreads.map((thread) => (
            <HistoryRow
              key={thread.id}
              thread={thread}
              active={thread.id === currentThreadId}
              running={thread.id === runningThreadId}
              renaming={thread.id === renamingId}
              onRename={() => setRenamingId(thread.id)}
              onRenameCommit={(title) => {
                setRenamingId(undefined)
                if (title !== (thread.title || '新对话')) {
                  void handlers?.renameThread(thread.id, title)
                }
              }}
              onRenameCancel={() => setRenamingId(undefined)}
              onOpenRuns={() => {
                void navigate({ to: '/chat/$threadId', params: { threadId: thread.id } })
                setRunsOpen(true, thread.id)
              }}
              onDelete={() => setDeleteTarget(thread)}
            />
          ))}
        </div>
        {historyHasMore || historyLoadingMore || historyLoadMoreError ? (
          <InfiniteScrollSentinel
            hasNextPage={historyHasMore}
            isFetchingNextPage={historyLoadingMore}
            isError={historyLoadMoreError}
            exhaustedLabel={null}
            rootSelector="[data-slot='scroll-area-viewport']"
            className="min-h-8 py-2"
            onLoadMore={() => {
              void handlers?.loadMoreThreads()
            }}
          />
        ) : null}
      </div>

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
                if (deleteTarget) void handlers?.deleteThread(deleteTarget.id)
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
