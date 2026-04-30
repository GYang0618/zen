import {
  cn,
  GradientText,
  Message,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from '@zen/ui'
import { Fragment } from 'react'

import { ToolFallback } from '@/components/tool-ui'
import { useAuthStore } from '@/stores'

import { useCopilot } from '../copilot-provider'
import { getCopilotToolUI } from '../tool-ui'
import { MessageActions } from './message-actions'

export function Messages() {
  const user = useAuthStore((state) => state.user)
  const { messages, status } = useCopilot()
  const isStreaming = status === 'streaming'
  return (
    <>
      {messages.length ? (
        messages.map(({ id, role, parts }) => {
          const isUser = role === 'user'
          return (
            <Fragment key={id}>
              {parts.map((part, partIndex) => (
                <Fragment key={`${id}-${partIndex}`}>
                  {(() => {
                    switch (part.type) {
                      case 'text': {
                        const isLastPart = partIndex === parts.length - 1
                        return (
                          <div className="group">
                            <Message from={role}>
                              <MessageContent>
                                <MessageResponse>{part.text}</MessageResponse>
                              </MessageContent>
                            </Message>
                            {isLastPart && (
                              <div
                                className={cn(
                                  isUser &&
                                    'pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100'
                                )}
                              >
                                <MessageActions from={role} part={part} />
                              </div>
                            )}
                          </div>
                        )
                      }

                      case 'reasoning': {
                        return (
                          <Reasoning className="w-full" isStreaming={isStreaming}>
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        )
                      }

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
              ))}
            </Fragment>
          )
        })
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <span className="text-center text-4xl leading-normal  font-bold">
            <GradientText text={`${user?.nickname || user?.username}，你好！`} />
            <br />
            <GradientText text="有什么可以帮你的吗？" />
          </span>
        </div>
      )}
    </>
  )
}
