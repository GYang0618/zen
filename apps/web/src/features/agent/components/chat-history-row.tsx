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
import { LoaderCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Thread } from '@copilotkit/react-core/v2'

const THREAD_TITLE_MAX_LENGTH = 80
const FALLBACK_TITLE = '新对话'
const MAX_RELATIVE_DAYS = 7
const DAY_MS = 86_400_000
/** 标题在操作条左侧的淡出宽度 */
const TITLE_FADE_WIDTH_CLASS = 'w-8'

type HistoryRowProps = {
  thread: Thread
  active: boolean
  running: boolean
  renaming: boolean
  onRename: () => void
  onRenameCommit: (title: string) => void
  onRenameCancel: () => void
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
  onDelete
}: HistoryRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hoveringRef = useRef(false)
  const scrollRafRef = useRef<number | null>(null)
  const ignoreBlurRef = useRef(false)
  const committedRef = useRef(false)
  const title = thread.name || FALLBACK_TITLE
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

        // 操作条绝对定位覆盖标题，可视宽度只扣操作区；
        // 淡出带叠在文字尾部，不额外占位，否则滚完会空一大截
        const actions = actionsRef.current
        const actionsVisible = actions !== null && getComputedStyle(actions).display !== 'none'
        const coveredWidth = actionsVisible ? actions.offsetWidth : 0
        const visibleWidth = Math.max(0, container.clientWidth - coveredWidth)
        const distance = el.scrollWidth - visibleWidth
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
      role="group"
      className={cn(
        'group/item relative flex h-8 w-full min-w-0 items-center gap-1 overflow-hidden rounded-full px-3 transition-all',
        'hover:bg-muted',
        active && 'bg-muted'
      )}
      data-active={active || undefined}
      onMouseEnter={scrollIfOverflow}
      onMouseLeave={resetScroll}
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
          {/*
            操作条叠在标题之上：主体用不透明底挡住文字，左侧再做透明→实色淡出。
            不能用 bg-inherit（行 hover 为 muted/70 时会透出标题造成叠字）。
          */}
          <div
            ref={actionsRef}
            className={cn(
              'absolute inset-y-0 right-3 z-10 hidden items-center gap-1',
              'bg-sidebar group-hover/item:bg-muted group-data-active/item:bg-muted',
              'group-hover/item:flex group-focus-within/item:flex has-data-popup-open:flex'
            )}
          >
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 right-full',
                TITLE_FADE_WIDTH_CLASS,
                'bg-linear-to-r from-transparent to-sidebar',
                'group-hover/item:to-muted group-data-active/item:to-muted'
              )}
            />
            <span className="relative text-xs leading-none font-normal text-muted-foreground">
              {formatRelativeTime(thread.updatedAt)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="对话操作"
                    className="relative rounded-full"
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem onClick={onRename}>
                  <Pencil />
                  重命名
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
