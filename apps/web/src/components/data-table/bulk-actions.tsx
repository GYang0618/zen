import { Badge, Button, cn, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Table } from '@tanstack/react-table'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
  entityName: string
  children: React.ReactNode
}

/**
 * 一个模块化的工具栏，用于显示当表格行被选中时的批量操作。
 *
 * @template TData 表格中的数据类型。
 * @param {object} props 组件属性。
 * @param {Table<TData>} props.table react-table 实例。
 * @param {string} props.entityName 被操作的实体的名称 (例如 "任务", "用户")。
 * @param {React.ReactNode} props.children 要在工具栏中渲染的操作按钮。
 * @returns {React.ReactNode | null} 渲染的组件或 null 如果没有选中任何行。
 */
export function DataTableBulkActions<TData>({
  table,
  entityName,
  children
}: DataTableBulkActionsProps<TData>): React.ReactNode | null {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState('')

  //  向屏幕阅读器宣布选择的变化。
  useEffect(() => {
    if (selectedCount > 0) {
      const message = `${selectedCount} ${entityName}${selectedCount > 1 ? 's' : ''} selected. Bulk actions toolbar is available.`

      //  使用 queueMicrotask 延迟状态更新并避免级联渲染。
      queueMicrotask(() => {
        setAnnouncement(message)
      })

      // 延迟后清除公告。
      const timer = setTimeout(() => setAnnouncement(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [selectedCount, entityName])

  const handleClearSelection = () => {
    table.resetRowSelection()
  }

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
        // 检查 Escape 键是否来自下拉菜单触发器或内容
        // 我们不能检查下拉菜单状态，因为 Radix UI 在我们处理程序运行之前关闭它
        const target = event.target as HTMLElement
        const activeElement = document.activeElement as HTMLElement

        // 检查事件目标或当前聚焦元素是否为下拉触发器
        const isFromDropdownTrigger =
          target?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
          activeElement?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
          target?.closest('[data-slot="dropdown-menu-trigger"]') ||
          activeElement?.closest('[data-slot="dropdown-menu-trigger"]')

        // 检查聚焦元素是否在下拉内容中 (这是 portaled 的)
        const isFromDropdownContent =
          activeElement?.closest('[data-slot="dropdown-menu-content"]') ||
          target?.closest('[data-slot="dropdown-menu-content"]')

        if (isFromDropdownTrigger || isFromDropdownContent) {
          // Escape 键用于下拉菜单 - 不清除选择
          return
        }

        // Escape 键用于工具栏 - 清除选择
        event.preventDefault()
        handleClearSelection()
        break
      }
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      {/* 屏幕阅读器公告区域 */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {announcement}
      </div>

      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label={`批量操作 for ${selectedCount} 已选择 ${entityName}${selectedCount > 1 ? 's' : ''}`}
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
                onClick={handleClearSelection}
                className="size-6 rounded-full"
                aria-label="Clear selection"
                title="Clear selection (Escape)"
              >
                <X />
                <span className="sr-only">清空选择</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>清空选择 ( Escape 键)</p>
            </TooltipContent>
          </Tooltip>

          <Separator className="h-5" orientation="vertical" aria-hidden="true" />

          <div className="flex items-center gap-x-1 text-sm" id="bulk-actions-description">
            <Badge
              variant="default"
              className="min-w-8 rounded-lg"
              aria-label={`${selectedCount} selected`}
            >
              {selectedCount}
            </Badge>{' '}
            <span className="hidden sm:inline">{entityName}</span> 已选择
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
