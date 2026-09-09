import { cn } from '@zen/ui'

import { ChatGreeting } from './chat-greeting'
import { ChatInput } from './chat-input'

interface ChatInputDockProps {
  ref?: React.Ref<HTMLDivElement>
  showEmptyGreeting: boolean
  online: boolean
  awaitingApproval: boolean
  loading: boolean
  threadId?: string
  onEnsureThread: (firstMessage: string) => Promise<string>
  onRunStart: (runId: string) => void
  onRunSettled: (runId: string) => void
  onStop: () => Promise<void>
}

export function ChatInputDock({
  ref,
  showEmptyGreeting,
  online,
  awaitingApproval,
  loading,
  threadId,
  onEnsureThread,
  onRunStart,
  onRunSettled,
  onStop
}: ChatInputDockProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 w-full px-6',
        showEmptyGreeting && 'bottom-1/2 translate-y-1/2'
      )}
    >
      <div className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl relative pb-4">
        {showEmptyGreeting && <ChatGreeting className="relative z-10" />}
        <ChatInput
          className="relative z-10"
          online={online}
          awaitingApproval={awaitingApproval}
          loading={loading}
          threadId={threadId}
          onEnsureThread={onEnsureThread}
          onRunStart={onRunStart}
          onRunSettled={onRunSettled}
          onStop={onStop}
        />
        <div className="pointer-events-none absolute inset-0 z-0 w-full">
          <div className="h-full w-full bg-background backdrop-blur-xl mask-[linear-gradient(to_top,black_50%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_85%)] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none" />
        </div>
      </div>
    </div>
  )
}
