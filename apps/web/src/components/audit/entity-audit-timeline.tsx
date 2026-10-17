import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@zen/ui'
import { History } from 'lucide-react'
import { useState } from 'react'

import { useAuditList } from '@/features/system/audit/queries'

import { AuditTimeline } from './audit-timeline'

interface EntityAuditTimelineProps {
  resource: string
  resourceId: string
  resourceName?: string
  asSheet?: boolean
  trigger?: React.ReactNode
  className?: string
}

export function EntityAuditTimeline({
  resource,
  resourceId,
  resourceName,
  asSheet = true,
  trigger,
  className
}: EntityAuditTimelineProps) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useAuditList({
    resource,
    resourceId,
    pageSize: 50
  })

  const items = data?.items ?? []

  if (!asSheet) {
    return (
      <div className={className}>
        <AuditTimeline items={items} isLoading={isLoading} />
      </div>
    )
  }

  return (
    <>
      {trigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-inherit"
        >
          {trigger}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen(true)}
        >
          <History className="h-4 w-4" />
          历史轨迹
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {resourceName ? `「${resourceName}」的历史变更轨迹` : '实体变更历史'}
            </SheetTitle>
            <SheetDescription>按发生时间倒序记录全部更新、授权与操作行为</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto py-4 pr-3">
            <AuditTimeline items={items} isLoading={isLoading} emptyText="该实体暂无操作审计记录" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
