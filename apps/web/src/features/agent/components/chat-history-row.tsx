import { Link } from '@tanstack/react-router'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input
} from '@zen/ui'
import { Activity, LoaderCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AgentThreadSummary } from '../runtime-api'

const THREAD_TITLE_MAX_LENGTH = 80
const FALLBACK_TITLE = '新对话'
const MAX_RELATIVE_DAYS = 7
const DAY_MS = 86_400_000

type HistoryRowProps = {
  thread: AgentThreadSummary
  active: boolean
  running: boolean
  renaming: boolean
  onRename: () => void
  onRenameCommit: (title: string) => void
  onRenameCancel: () => void
  onOpenRuns: () => void
  onDelete: () => void
}

export function HistoryRow({
  thread,
  active,
  running,
  renaming,
  onRename,
  onRenameCommit,
  onRenameCancel,
  onOpenRuns,
  onDelete
}: HistoryRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hoveringRef = useRef(false)
  const scrollRafRef = useRef<number | null>(null)
  const ignoreBlurRef = useRef(false)
  const committedRef = useRef(false)
  const title = thread.title || FALLBACK_TITLE
  const [draft, setDraft] = useState(title)

  useEffect(() => {
    if (!renaming) return
    setDraft(title)
    committedRef.current = false
    ignoreBlurRef.current = false
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [renaming, title])

  const cancelPendingScroll = () => {
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = null
    }
  }

  const resetScroll = () => {
    hoveringRef.current = false
    cancelPendingScroll()
    const el = textRef.current
    if (!el) return

    const current = getComputedStyle(el).transform
    el.style.transition = 'none'
    el.style.transform = current === 'none' ? 'translateX(0px)' : current
    void el.offsetWidth
    el.style.transform = 'translateX(0)'
  }

  const scrollIfOverflow = () => {
    hoveringRef.current = true
    cancelPendingScroll()

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null
        if (!hoveringRef.current) return

        const container = containerRef.current
        const el = textRef.current
        if (!container || !el) return

        const distance = el.scrollWidth - container.clientWidth
        if (distance <= 0) {
          el.style.transition = 'none'
          el.style.transform = 'translateX(0)'
          return
        }

        const durationMs = Math.min(Math.max(distance * 18, 800), 4000)
        el.style.transition = 'none'
        el.style.transform = 'translateX(0)'
        void el.offsetWidth
        if (!hoveringRef.current) return
        el.style.transition = `transform ${durationMs}ms linear`
        el.style.transform = `translateX(-${distance}px)`
      })
    })
  }

  const commitRename = () => {
    if (committedRef.current) return
    committedRef.current = true
    onRenameCommit(draft.trim() || FALLBACK_TITLE)
  }

  return (
    <div
      className={cn(
        'group/item flex h-8 w-full min-w-0 items-center gap-1 overflow-hidden rounded-full px-3 transition-all',
        'hover:bg-muted/70 dark:hover:bg-muted/50',
        active && 'bg-muted'
      )}
      data-active={active || undefined}
    >
      {renaming ? (
        <Input
          ref={inputRef}
          value={draft}
          maxLength={THREAD_TITLE_MAX_LENGTH}
          aria-label="对话标题"
          className="h-6 min-w-0 flex-1 px-2 text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (ignoreBlurRef.current) return
            commitRename()
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'Enter') {
              event.preventDefault()
              commitRename()
              return
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              ignoreBlurRef.current = true
              onRenameCancel()
            }
          }}
        />
      ) : (
        <>
          <Link
            to="/chat/$threadId"
            params={{ threadId: thread.id }}
            aria-current={active ? 'page' : undefined}
            aria-label={running ? `${title}（正在运行）` : title}
            className="flex h-full min-w-0 flex-1 items-center gap-1 text-sm font-normal text-foreground no-underline outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onMouseEnter={scrollIfOverflow}
            onMouseLeave={resetScroll}
          >
            {running && (
              <LoaderCircle
                className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1 text-left">
              <div
                ref={containerRef}
                className="overflow-hidden whitespace-nowrap text-sm leading-normal font-normal"
              >
                <span
                  key={title}
                  ref={textRef}
                  className="inline-block max-w-none will-change-transform"
                >
                  {title}
                </span>
              </div>
            </div>
          </Link>
          <div className="relative hidden shrink-0 items-center gap-1 group-hover/item:flex group-focus-within/item:flex has-data-[state=open]:flex">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-5 w-5 bg-linear-to-r from-transparent to-sidebar group-hover/item:to-muted/70 group-data-active/item:to-muted"
            />
            <span className="relative text-xs leading-none font-normal text-muted-foreground">
              {formatRelativeTime(thread.updatedAt)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="对话操作"
                  className="relative rounded-full"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem onClick={onRename}>
                  <Pencil />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenRuns}>
                  <Activity />
                  运行记录
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  )
}

/** 相对时间：1s / 1m / 1h / 1d，最多到 7d。 */
export function formatRelativeTime(value: string): string {
  const delta = Math.max(0, Date.now() - new Date(value).getTime())
  if (delta < 60_000) return `${Math.max(1, Math.floor(delta / 1000))}s`
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`
  if (delta < DAY_MS) return `${Math.floor(delta / 3_600_000)}h`
  const days = Math.min(MAX_RELATIVE_DAYS, Math.floor(delta / DAY_MS))
  return `${days}d`
}
