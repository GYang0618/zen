import { cn, MessageAction, MessageActions } from '@zen/ui'
import { Check, Copy, Pencil } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useAgentChatInputStore } from '../stores/agent-chat-input'

interface ChatUserActionsProps {
  text: string
  className?: string
}

export function ChatUserActions({ text, className }: ChatUserActionsProps) {
  const [copied, setCopied] = useState(false)
  const setEditDraft = useAgentChatInputStore((state) => state.setEditDraft)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('复制成功')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }, [text])

  const handleEdit = useCallback(() => {
    setEditDraft(text)
    toast.info('已填入输入框')
  }, [setEditDraft, text])

  return (
    <MessageActions
      className={cn(
        'ml-auto flex items-center gap-1 justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
        className
      )}
    >
      <MessageAction tooltip="重新编辑" label="重新编辑" onClick={handleEdit}>
        <Pencil className="size-3.5" />
      </MessageAction>
      <MessageAction
        tooltip={copied ? '已复制' : '复制'}
        label={copied ? '已复制' : '复制'}
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
      </MessageAction>
    </MessageActions>
  )
}
