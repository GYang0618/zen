import { cn, MessageAction, MessageActions as MessageActionsPrimitive } from '@zen/ui'
import { Copy, Pencil, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'

import { useCopilot } from '../copilot-provider'

import type { TextUIPart, UIMessage } from 'ai'

interface MessageActionsProps {
  from: UIMessage['role']
  part: TextUIPart
}

export function MessageActions({ part, from }: MessageActionsProps) {
  const { regenerate } = useCopilot()
  const isUser = from === 'user'
  const isAssistant = from === 'assistant'
  return (
    <MessageActionsPrimitive className={cn('h-9', isUser && 'justify-end')}>
      {isUser && (
        <MessageAction label="编辑">
          <Pencil />
        </MessageAction>
      )}
      <MessageAction onClick={() => navigator.clipboard.writeText(part.text)} label="复制">
        <Copy />
      </MessageAction>
      {isAssistant && (
        <>
          <MessageAction label="喜欢">
            <ThumbsUp />
          </MessageAction>
          <MessageAction label="不喜欢">
            <ThumbsDown />
          </MessageAction>
          <MessageAction onClick={() => regenerate()} label="重试">
            <RefreshCw />
          </MessageAction>
        </>
      )}
    </MessageActionsPrimitive>
  )
}
