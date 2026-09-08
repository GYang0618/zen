import { Message, MessageContent, Shimmer } from '@zen/ui'
import { Sparkles } from 'lucide-react'

export function ChatPendingMessage() {
  return (
    <Message
      from="assistant"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="status"
      aria-live="polite"
    >
      <MessageContent className="border-none bg-transparent px-0 py-1 shadow-none">
        <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-3.5 animate-pulse" />
          </div>
          <Shimmer duration={1.6} className="font-normal">
            工作中...
          </Shimmer>
        </div>
      </MessageContent>
    </Message>
  )
}
