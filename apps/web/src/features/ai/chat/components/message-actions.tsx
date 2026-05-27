import { cn, MessageAction, MessageActions as MessageActionsPrimitive } from '@zen/ui'
import { Check, Copy, Pencil, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useRef, useState } from 'react'

import { useCopilot } from '../copilot-provider'

import type { TextUIPart, UIMessage } from 'ai'

interface MessageActionsProps {
  from: UIMessage['role']
  part: TextUIPart
}

export function MessageActions({ part, from }: MessageActionsProps) {
  const { regenerate } = useCopilot()
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | null>(null)
  const isUser = from === 'user'
  const isAssistant = from === 'assistant'

  const handleCopy = async () => {
    try {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current)
        copyTimer.current = null
      }
      await navigator.clipboard.writeText(part.text)
      setCopied(true)
      copyTimer.current = setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('复制失败: ', error)
    }
  }
  return (
    <MessageActionsPrimitive className={cn('h-9', isUser && 'justify-end')}>
      {isUser && (
        <MessageAction label="编辑">
          <Pencil />
        </MessageAction>
      )}
      <MessageAction onClick={handleCopy} label="复制">
        {copied ? <Check className="stroke-emerald-500" /> : <Copy />}
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
