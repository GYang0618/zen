import { Fragment } from 'react'

import { ToolFallback } from '@/components/tool-ui'

import { useCopilot } from '../copilot-provider'
import { getCopilotToolUI } from '../tool-ui'
import AIMessage from './ai-message'
import { HumanMessage } from './human-message'

import type { UIMessage } from 'ai'

export function Messages({ parts, role }: UIMessage) {
  const { status } = useCopilot()
  const isUserRole = role === 'user'
  const isAssistantRole = role === 'assistant'
  const isStreaming = status === 'streaming'

  return (
    <>
      {parts.map((part, i) => {
        return (
          <Fragment key={`${part.type}-${i}`}>
            {(() => {
              switch (part.type) {
                case 'text':
                  if (isUserRole) return <HumanMessage message={part.text} />
                  if (isAssistantRole)
                    return <AIMessage message={part.text} isAnimating={isStreaming} />
                  return null

                case 'dynamic-tool': {
                  const Component = getCopilotToolUI(part.toolName)
                  if (!Component) return <ToolFallback part={part} />
                  return <Component part={part} />
                }

                default:
                  return null
              }
            })()}
          </Fragment>
        )
      })}
    </>
  )
}
