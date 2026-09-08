import { useDefaultRenderTool } from '@copilotkit/react-core/v2'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@zen/ui'
import { useEffect, useMemo, useState } from 'react'

import { formatToolTitle } from '../lib/tool-title'

import type { ToolState } from '@zen/ui'

const AUTO_COLLAPSE_DELAY_MS = 1000

interface DefaultToolCardProps {
  name: string
  parameters: unknown
  status: 'inProgress' | 'executing' | 'complete'
  result: string | undefined
}

function mapToToolState(
  status: 'inProgress' | 'executing' | 'complete',
  isError: boolean
): ToolState {
  if (isError) return 'output-error'
  if (status === 'complete') return 'output-available'
  if (status === 'executing') return 'input-available'
  return 'input-streaming'
}

function checkIsError(result: string | undefined): boolean {
  if (!result) return false
  try {
    const parsed = JSON.parse(result) as Record<string, unknown>
    if (parsed.success === false || (typeof parsed.code === 'number' && parsed.code >= 400)) {
      return true
    }
  } catch {
    // 纯文本若包含异常关键词亦可判定
    if (result.startsWith('Error:') || result.startsWith('失败:')) return true
  }
  return false
}

function DefaultToolCard({ name, parameters, status, result }: DefaultToolCardProps) {
  const isError = useMemo(() => checkIsError(result), [result])
  const toolState = mapToToolState(status, isError)
  const isRunning = status === 'inProgress' || status === 'executing'
  const [open, setOpen] = useState(isRunning)

  useEffect(() => {
    if (isRunning) {
      setOpen(true)
      return
    }

    // 运行完成且未出错时，延时平滑折叠，保持对话主干清晰
    if (!isError) {
      const timer = window.setTimeout(() => setOpen(false), AUTO_COLLAPSE_DELAY_MS)
      return () => window.clearTimeout(timer)
    }
  }, [isRunning, isError])

  const title = formatToolTitle(name)
  const hasParams =
    parameters !== undefined &&
    parameters !== null &&
    (typeof parameters !== 'object' || Object.keys(parameters as object).length > 0)

  return (
    <Tool open={open} onOpenChange={setOpen}>
      <ToolHeader title={title} state={toolState} />
      <ToolContent>
        {hasParams && <ToolInput input={parameters} />}
        {result && <ToolOutput output={result} />}
      </ToolContent>
    </Tool>
  )
}

export function useDefaultToolRender() {
  useDefaultRenderTool({
    render: ({ name, parameters, status, result }) => (
      <DefaultToolCard name={name} parameters={parameters} status={status} result={result} />
    )
  })
}
