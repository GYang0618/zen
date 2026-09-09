import { cn, MessageAction, MessageActions } from '@zen/ui'
import { Check, Copy, Link2, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface ChatAssistantActionsProps {
  content: string
  onRetry: () => void
  isRunning?: boolean
  className?: string
}

export function ChatAssistantActions({
  content,
  onRetry,
  isRunning = false,
  className
}: ChatAssistantActionsProps) {
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('复制成功')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }, [content])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      toast.success('链接已复制')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast.error('复制链接失败')
    }
  }, [])

  return (
    <MessageActions className={cn('mt-1 flex items-center gap-1', className)}>
      <MessageAction
        tooltip={copied ? '已复制' : '复制'}
        label={copied ? '已复制' : '复制'}
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
      </MessageAction>
      <MessageAction tooltip="重新回复" label="重新回复" onClick={onRetry} disabled={isRunning}>
        <RefreshCw className="size-3.5" />
      </MessageAction>
      <MessageAction
        tooltip={linkCopied ? '已复制链接' : '复制链接'}
        label={linkCopied ? '已复制链接' : '复制链接'}
        onClick={handleCopyLink}
      >
        {linkCopied ? <Check className="size-3.5 text-primary" /> : <Link2 className="size-3.5" />}
      </MessageAction>
    </MessageActions>
  )
}
