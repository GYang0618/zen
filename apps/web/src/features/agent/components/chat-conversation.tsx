import { Conversation, ConversationContent, ConversationScrollButton } from '@zen/ui'

import { ChatApprovalRegistration } from './chat-approval'
import { ChatMessages } from './chat-messages'
import { ChatThreadSkeleton } from './chat-thread-skeleton'

import type { AgentApproval } from '../runtime-api'

const DRAFT_ROUTE_THREAD_ID = 'draft'

interface ChatConversationProps {
  threadId?: string
  threadLoading: boolean
  inputDockHeight: number
  persistedApproval: AgentApproval | null
  onPendingApprovalChange: (pending: boolean) => void
  onPersistedDecision: (decision: 'approve' | 'reject') => Promise<void>
  onLiveInterrupt: () => void
}

export function ChatConversation({
  threadId,
  threadLoading,
  inputDockHeight,
  persistedApproval,
  onPendingApprovalChange,
  onPersistedDecision,
  onLiveInterrupt
}: ChatConversationProps) {
  const activeThreadId = threadId ?? DRAFT_ROUTE_THREAD_ID

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
              <ChatMessages key={activeThreadId} threadId={activeThreadId} />
              <ChatApprovalRegistration
                persistedApproval={persistedApproval}
                onPendingChange={onPendingApprovalChange}
                onPersistedDecision={onPersistedDecision}
                onLiveInterrupt={onLiveInterrupt}
              />
            </>
          )}
        </div>
      </ConversationContent>
      <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
    </Conversation>
  )
}
