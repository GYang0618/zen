'use client'

import { A2UIRenderer, useA2UIActions, useA2UIError } from '@copilotkit/a2ui-renderer'
import { Alert, AlertDescription, AlertTitle } from '@zen/ui'
import { AlertCircle, Loader2 } from 'lucide-react'
import { memo, useEffect, useRef } from 'react'

import type { A2UISurfaceDescriptor } from './use-a2ui-surfaces'

interface A2UISurfaceHostProps {
  surface: A2UISurfaceDescriptor
}

export const A2UISurfaceHost = memo(function A2UISurfaceHost({ surface }: A2UISurfaceHostProps) {
  const { processMessages, getSurface } = useA2UIActions()
  const error = useA2UIError()
  const lastOpsHashRef = useRef('')

  useEffect(() => {
    const hash = JSON.stringify(surface.operations)
    if (hash === lastOpsHashRef.current) return
    lastOpsHashRef.current = hash
    if (surface.operations.length === 0) return

    const existing = getSurface(surface.surfaceId)
    // 若 surface 已在 MessageProcessor 中初始化，跳过重复的 createSurface 操作
    const safeOps = existing
      ? surface.operations.filter((op) => !op?.createSurface)
      : surface.operations

    processMessages(safeOps)
  }, [surface.surfaceId, surface.operations, processMessages, getSurface])

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>生成式界面渲染异常</AlertTitle>
          <AlertDescription className="mt-1 text-xs">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full" data-surface-id={surface.surfaceId}>
      <A2UIRenderer
        surfaceId={surface.surfaceId}
        className="w-full"
        fallback={
          <div className="space-y-3 rounded-xl border border-border/50 bg-card/50 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>正在构建生成式界面...</span>
            </div>
            <div className="h-44 w-full animate-pulse rounded-lg bg-muted/40" />
          </div>
        }
      />
    </div>
  )
})
