import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@zen/ui'
import { useEffect, useState } from 'react'

import { getToolTitle } from './tool-display'

import type { ToolState } from '@zen/ui'

export type CopilotToolCallStatus = 'inProgress' | 'executing' | 'complete'

export interface ToolCallCardProps {
  name: string
  status: CopilotToolCallStatus | string
  parameters?: unknown
  result?: string
  count?: number
  completedCount?: number
}

const AUTO_CLOSE_DELAY_MS = 800

function normalizeStatus(status: CopilotToolCallStatus | string): CopilotToolCallStatus {
  if (status === 'complete' || status === 'Complete') return 'complete'
  if (status === 'executing' || status === 'Executing') return 'executing'
  return 'inProgress'
}

function toToolState(status: CopilotToolCallStatus): ToolState {
  if (status === 'complete') return 'output-available'
  if (status === 'executing') return 'input-available'
  return 'input-streaming'
}

function formatToolTitle(
  name: string,
  count = 1,
  completedCount?: number,
  status?: CopilotToolCallStatus
): string {
  const base = getToolTitle(name)
  if (count <= 1) return base
  if (status !== 'complete' && completedCount !== undefined) {
    return `${base} · ${completedCount}/${count}`
  }
  return `${base} · ${count} 项`
}

function isToolCallActive(status: CopilotToolCallStatus | string): boolean {
  const normalized = normalizeStatus(status)
  return normalized === 'inProgress' || normalized === 'executing'
}

export function ToolCallCard({
  name,
  status,
  parameters,
  result,
  count = 1,
  completedCount
}: ToolCallCardProps) {
  const normalized = normalizeStatus(status)
  const state = toToolState(normalized)
  const isActive = isToolCallActive(normalized)
  const [open, setIsOpen] = useState(isActive)

  useEffect(() => {
    if (isActive) {
      setIsOpen(true)
      return
    }

    const timer = window.setTimeout(() => setIsOpen(false), AUTO_CLOSE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isActive])

  return (
    <Tool open={open} onOpenChange={setIsOpen}>
      <ToolHeader title={formatToolTitle(name, count, completedCount, normalized)} state={state} />
      <ToolContent>
        <ToolInput input={parameters} />
        <ToolOutput output={result} />
      </ToolContent>
    </Tool>
  )
}
