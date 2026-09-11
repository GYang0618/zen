import { Conversation, ConversationContent, ConversationScrollButton } from '@zen/ui'

import { ChatApprovalRegistration } from './chat-approval'
import { ChatMessages } from './chat-messages'
import { ChatThreadSkeleton } from './chat-thread-skeleton'

interface ChatConversationProps {
  threadLoading?: boolean
  inputDockHeight: number
  onPendingApprovalChange?: (pending: boolean) => void
}

export function ChatConversation({
  threadLoading = false,
  inputDockHeight,
  onPendingApprovalChange
}: ChatConversationProps) {
  return (
    <Conversation>
      <ConversationContent>
        <div
          className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl flex flex-col gap-4"
          style={{ paddingBottom: inputDockHeight }}
        >
          {threadLoading ? (
            <ChatThreadSkeleton />
          ) : (
            <>
              <ChatMessages />
              <ChatApprovalRegistration onPendingChange={onPendingApprovalChange} />
            </>
          )}
        </div>
      </ConversationContent>
      <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
    </Conversation>
  )
}
