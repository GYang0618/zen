import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@zen/ui'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { ChatApprovalRegistration } from './chat-approval'
import { ChatMessages } from './chat-messages'
import { ChatThreadSkeleton } from './chat-thread-skeleton'

export type ChatHistoryStatus = 'loading' | 'ready' | 'failed' | 'empty'

export function resolveHistoryStatus(input: {
  isConnecting: boolean
  connectFailed: boolean
  hasExplicitThreadId: boolean
  messageCount: number
}): ChatHistoryStatus {
  if (input.isConnecting) return 'loading'
  if (input.connectFailed && input.messageCount === 0) return 'failed'
  if (input.hasExplicitThreadId && input.messageCount === 0) return 'empty'
  return 'ready'
}

interface ChatConversationProps {
  historyStatus?: ChatHistoryStatus
  inputDockHeight: number
  onPendingApprovalChange?: (pending: boolean) => void
  onRetryHistory?: () => void
}

export function ChatConversation({
  historyStatus = 'ready',
  inputDockHeight,
  onPendingApprovalChange,
  onRetryHistory
}: ChatConversationProps) {
  return (
    <Conversation>
      <ConversationContent>
        <div
          className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl flex flex-col gap-4"
          style={{ paddingBottom: inputDockHeight }}
        >
          {historyStatus === 'loading' ? <ChatThreadSkeleton /> : null}
          {historyStatus === 'failed' ? <ChatHistoryFailure onRetry={onRetryHistory} /> : null}
          {historyStatus === 'empty' ? <ChatHistoryEmpty /> : null}
          {historyStatus === 'ready' ? (
            <>
              <ChatMessages />
              <ChatApprovalRegistration onPendingChange={onPendingApprovalChange} />
            </>
          ) : null}
        </div>
      </ConversationContent>
      <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
    </Conversation>
  )
}

function ChatHistoryFailure({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle />
        <AlertTitle>历史记录加载失败</AlertTitle>
        <AlertDescription>这次对话没有载入，请重试。</AlertDescription>
      </Alert>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw />
        重试
      </Button>
    </div>
  )
}

function ChatHistoryEmpty() {
  return <p className="text-sm text-muted-foreground">这条对话没有保存下可显示的消息。</p>
}
