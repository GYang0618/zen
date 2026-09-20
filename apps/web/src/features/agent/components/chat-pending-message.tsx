import { Message, MessageContent, Shimmer } from '@zen/ui'
import { Sparkles } from 'lucide-react'

export function ChatPendingMessage({ label }: { label?: string }) {
  const text = label ?? '工作中...'
  return (
    <Message
      from="assistant"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <MessageContent className="border-none bg-transparent px-0 py-1 shadow-none">
        <div className="flex items-center gap-2 py-1 text-muted-foreground">
          <Sparkles className="size-3.5 animate-pulse text-primary/70" />
          <Shimmer duration={1.5} className="text-xs font-normal text-muted-foreground">
            {text}
          </Shimmer>
        </div>
      </MessageContent>
    </Message>
  )
}
