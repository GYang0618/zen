'use no memo'

import { Badge, Button, cn, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Table } from '@tanstack/react-table'

type BulkActionsToolbarProps = {
  selectedCount: number
  entityName: string
  onClearSelection: () => void
  children: React.ReactNode
  /** 选择模式已开启时，即使尚未勾选也显示工具栏 */
  visible?: boolean
}

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
  entityName: string
  children: React.ReactNode
}

/**
 * 底部悬浮批量操作条。未开启选择且选中数量为 0 时不渲染。
 */
export function BulkActionsToolbar({
  selectedCount,
  entityName,
  onClearSelection,
  children,
  visible
}: BulkActionsToolbarProps): React.ReactNode | null {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState('')
  const isOpen = visible || selectedCount > 0
  const statusText =
    selectedCount > 0 ? `${selectedCount} ${entityName} 已选择` : `请选择${entityName}`

  useEffect(() => {
    if (!isOpen) return

    queueMicrotask(() => {
      setAnnouncement(statusText)
    })

    const timer = setTimeout(() => setAnnouncement(''), 3000)
    return () => clearTimeout(timer)
  }, [isOpen, statusText])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const buttons = toolbarRef.current?.querySelectorAll('button')
    if (!buttons) return

    const currentIndex = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)

    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault()
        const nextIndex = (currentIndex + 1) % buttons.length
        buttons[nextIndex]?.focus()
        break
      }
      case 'ArrowLeft': {
        event.preventDefault()
        const prevIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1
        buttons[prevIndex]?.focus()
        break
      }
      case 'Home':
        event.preventDefault()
        buttons[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        buttons[buttons.length - 1]?.focus()
        break
      case 'Escape': {
        const target = event.target as HTMLElement
        const activeElement = document.activeElement as HTMLElement

        const isFromDropdownTrigger =
          target?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
          activeElement?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
          target?.closest('[data-slot="dropdown-menu-trigger"]') ||
          activeElement?.closest('[data-slot="dropdown-menu-trigger"]')

        const isFromDropdownContent =
          activeElement?.closest('[data-slot="dropdown-menu-content"]') ||
          target?.closest('[data-slot="dropdown-menu-content"]')

        if (isFromDropdownTrigger || isFromDropdownContent) {
          return
        }

        event.preventDefault()
        onClearSelection()
        break
      }
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {announcement}
      </div>

      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label={statusText}
        aria-describedby="bulk-actions-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl',
          'transition-all delay-100 duration-300 ease-out hover:scale-105',
          'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
        )}
      >
        <div
          className={cn(
            'p-2 shadow-xl',
            'rounded-xl border',
            'bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/60',
            'flex items-center gap-x-2'
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onClearSelection}
                className="size-6 rounded-full"
                aria-label={selectedCount > 0 ? '清空选择' : '退出选择'}
                title={selectedCount > 0 ? '清空选择 (Escape)' : '退出选择 (Escape)'}
              >
                <X />
                <span className="sr-only">{selectedCount > 0 ? '清空选择' : '退出选择'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{selectedCount > 0 ? '清空选择 ( Escape 键)' : '退出选择 ( Escape 键)'}</p>
            </TooltipContent>
          </Tooltip>

          <Separator className="h-5" orientation="vertical" aria-hidden="true" />

          <div className="flex items-center gap-x-1 text-sm" id="bulk-actions-description">
            {selectedCount > 0 ? (
              <>
                <Badge
                  variant="default"
                  className="min-w-8 rounded-lg"
                  aria-label={`${selectedCount} selected`}
                >
                  {selectedCount}
                </Badge>{' '}
                <span className="hidden sm:inline">{entityName}</span> 已选择
              </>
            ) : (
              <span className="px-1 text-muted-foreground">请选择{entityName}</span>
            )}
          </div>

          <div>
            <Separator className="h-5" orientation="vertical" aria-hidden="true" />
          </div>

          {children}
        </div>
      </div>
    </>
  )
}

/**
 * 基于 react-table 行选择的批量操作工具栏。
 */
export function DataTableBulkActions<TData>({
  table,
  entityName,
  children
}: DataTableBulkActionsProps<TData>): React.ReactNode | null {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <BulkActionsToolbar
      selectedCount={selectedCount}
      entityName={entityName}
      onClearSelection={() => table.resetRowSelection()}
    >
      {children}
    </BulkActionsToolbar>
  )
}
