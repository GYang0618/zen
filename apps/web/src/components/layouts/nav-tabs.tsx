import { Link, useLocation, useMatches, useNavigate } from '@tanstack/react-router'
import { cn } from '@zen/ui'
import { X } from 'lucide-react'
import { useEffect } from 'react'

import { useTabsStore } from '@/stores'

import type { MouseEvent } from 'react'
import type { TabItem } from '@/stores/tabs'

/** 将当前路由同步到多页签 store */
export function TabsSync() {
  const matches = useMatches()
  const pathname = useLocation({ select: (location) => location.pathname })
  const addTab = useTabsStore((state) => state.addTab)
  const setActive = useTabsStore((state) => state.setActive)

  useEffect(() => {
    const leaf = matches[matches.length - 1]
    const meta = leaf?.staticData
    if (!meta?.title) return

    addTab({
      id: pathname,
      title: meta.title,
      path: pathname,
      affix: meta.affix
    })
    setActive(pathname)
  }, [pathname, matches, addTab, setActive])

  return null
}

export function NavTabs({ className }: { className?: string }) {
  const navigate = useNavigate()
  const tabs = useTabsStore((state) => state.tabs)
  const activeId = useTabsStore((state) => state.activeId)
  const removeTab = useTabsStore((state) => state.removeTab)

  if (tabs.length === 0) return null

  const handleClose = (event: MouseEvent, tab: TabItem) => {
    event.preventDefault()
    event.stopPropagation()
    if (tab.affix) return

    const wasActive = activeId === tab.id
    removeTab(tab.id)

    if (!wasActive) return

    const remaining = useTabsStore.getState().tabs
    const next = remaining[remaining.length - 1]
    void navigate({ to: next?.path ?? '/' })
  }

  return (
    <div
      role="tablist"
      aria-label="打开的页面"
      className={cn(
        'flex items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            className={cn(
              'group inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-xs transition-colors',
              isActive
                ? 'border-border bg-background text-foreground shadow-sm'
                : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Link
              to={tab.path}
              className="max-w-36 truncate outline-none"
              onClick={() => useTabsStore.getState().setActive(tab.id)}
            >
              {tab.title}
            </Link>
            {!tab.affix && (
              <button
                type="button"
                aria-label={`关闭 ${tab.title}`}
                className={cn(
                  'inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground',
                  'opacity-60 hover:bg-muted-foreground/15 hover:text-foreground hover:opacity-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
                onClick={(event) => handleClose(event, tab)}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
