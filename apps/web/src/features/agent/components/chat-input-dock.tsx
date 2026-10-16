import { cn } from '@zen/ui'

import { ChatGreeting } from './chat-greeting'
import { ChatInput } from './chat-input'

interface ChatInputDockProps {
  ref?: React.Ref<HTMLDivElement>
  showEmptyGreeting: boolean
  online?: boolean
  awaitingApproval?: boolean
  loading?: boolean
  threadId?: string
}

export function ChatInputDock({
  ref,
  showEmptyGreeting,
  online = true,
  awaitingApproval = false,
  loading = false,
  threadId
}: ChatInputDockProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 w-full px-6 pb-4',
        showEmptyGreeting && 'bottom-1/2 translate-y-1/2'
      )}
    >
      <div className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl relative">
        {showEmptyGreeting && <ChatGreeting threadId={threadId} className="relative z-10" />}
        <ChatInput
          className="relative z-10"
          online={online}
          awaitingApproval={awaitingApproval}
          loading={loading}
          threadId={threadId}
        />
      </div>
    </div>
  )
}
