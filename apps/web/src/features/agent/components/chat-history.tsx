'use client'

import { useThreads } from '@copilotkit/react-core/v2'
import { useLocation, useNavigate } from '@tanstack/react-router'
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
import { useMemo, useEffect, useState } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { parseThreadIdFromPath, useShellModeStore } from '@/stores'

import { isProvisionalThreadNewer, mergeHistoryThreads } from '../lib/merge-history-threads'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { HistoryRow } from './chat-history-row'

import type { Thread } from '@copilotkit/react-core/v2'

export { formatRelativeTime } from './chat-history-row'

export function ChatHistory() {
  const {
    threads,
    isLoading: historyLoading,
    error: historyError,
    hasMoreThreads: historyHasMore,
    isFetchingMoreThreads: historyLoadingMore,
    fetchMoreThreads,
    renameThread,
    deleteThread,
    refetchThreads
  } = useThreads({ agentId: 'default' })
  const { pathname } = useLocation()
  const lastAgentPath = useShellModeStore((state) => state.lastAgentPath)
  const currentThreadId = parseThreadIdFromPath(pathname) ?? parseThreadIdFromPath(lastAgentPath)
  const triggerNewThread = useAgentChatInputStore((state) => state.triggerNewThread)
  const runningThreadIds = useAgentChatInputStore((state) => state.runningThreadIds)
  const markThreadRunning = useAgentChatInputStore((state) => state.markThreadRunning)
  const provisionalThreads = useAgentChatInputStore((state) => state.provisionalThreads)
  const removeProvisionalThread = useAgentChatInputStore((state) => state.removeProvisionalThread)
  const historyRefreshNonce = useAgentChatInputStore((state) => state.historyRefreshNonce)
  const navigate = useNavigate()

  const [deleteTarget, setDeleteTarget] = useState<Thread | null>(null)
  const [renamingId, setRenamingId] = useState<string>()

  useEffect(() => {
    if (historyRefreshNonce === 0) return
    void refetchThreads()
  }, [historyRefreshNonce, refetchThreads])

  // 服务端列表已包含最终标题时再清乐观项；避免「仅有临时标题」时把本地精炼结果删掉
  useEffect(() => {
    for (const provisional of provisionalThreads) {
      const server = threads.find((thread) => thread.id === provisional.id)
      if (!server?.name?.trim()) continue

      const clientName = provisional.name?.trim()
      const serverName = server.name.trim()
      if (clientName && clientName !== serverName && isProvisionalThreadNewer(server, provisional)) {
        continue
      }

      removeProvisionalThread(provisional.id)
    }
  }, [threads, provisionalThreads, removeProvisionalThread])

  const activeThreads = useMemo(
    () => mergeHistoryThreads(threads, provisionalThreads).filter((thread) => !thread.archived),
    [threads, provisionalThreads]
  )

  const handleDelete = async (target: Thread) => {
    markThreadRunning(target.id, false)
    removeProvisionalThread(target.id)
    await deleteThread(target.id)
    if (currentThreadId === target.id) {
      triggerNewThread()
      void navigate({ to: '/chat' })
    }
  }

  return (
    <>
      {/* w-0 min-w-full：抵消 Radix ScrollArea 内层 display:table，避免长标题把侧栏撑开 */}
      <div className="flex w-0 min-w-full flex-col">
        {historyLoading && activeThreads.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">正在加载</p>
        )}
        {!historyLoading && historyError && activeThreads.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-destructive">
            历史会话加载失败：{historyError.message}
          </p>
        )}
        {!historyLoading &&
          !historyError &&
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
              running={runningThreadIds.has(thread.id)}
              renaming={thread.id === renamingId}
              onRename={() => setRenamingId(thread.id)}
              onRenameCommit={(title) => {
                setRenamingId(undefined)
                if (title !== (thread.name || '新对话')) {
                  void renameThread(thread.id, title)
                }
              }}
              onRenameCancel={() => setRenamingId(undefined)}
              onDelete={() => setDeleteTarget(thread)}
            />
          ))}
        </div>
        {historyHasMore || historyLoadingMore ? (
          <InfiniteScrollSentinel
            hasNextPage={historyHasMore}
            isFetchingNextPage={historyLoadingMore}
            isError={false}
            exhaustedLabel={null}
            rootSelector="[data-slot='scroll-area-viewport']"
            className="min-h-8 py-2"
            onLoadMore={() => {
              void fetchMoreThreads()
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
              “{deleteTarget?.name || '新对话'}”的消息和记录将一并删除，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void handleDelete(deleteTarget)
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
