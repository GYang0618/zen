import { Message, MessageContent } from '@zen/ui'

export function ChatPendingMessage({ label }: { label?: string }) {
  return (
    <Message
      from="assistant"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="status"
      aria-live="polite"
      aria-label={label ?? '正在等待回复...'}
    >
      <MessageContent className="border-none bg-transparent px-0 py-1 shadow-none">
        <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-primary/80 animate-pulse" />
          <span className="inline-block size-2 rounded-full bg-primary/50 animate-pulse [animation-delay:200ms]" />
          <span className="inline-block size-2 rounded-full bg-primary/25 animate-pulse [animation-delay:400ms]" />
          {label && <span className="ms-1.5 text-xs font-normal">{label}</span>}
        </div>
      </MessageContent>
    </Message>
  )
}
