'use client'

import { UseAgentUpdate, useRenderActivityMessage } from '@copilotkit/react-core/v2'
import { listChatAttachments, readZenMessageTiming, visibleChatText } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  cn,
  Message,
  MessageContent,
  MessageResponse,
  Shimmer
} from '@zen/ui'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Fragment, useMemo } from 'react'

import { resolveStreamingCanvasTitle } from '../a2ui/resolve-a2ui-title'
import { useChatAgent } from '../context/chat-agent-context'
import { useAgentRetry } from '../hooks/use-agent-retry'
import { useReasoningDuration } from '../hooks/use-reasoning-duration'
import {
  A2UI_ACTIVITY_TYPE,
  findTurnGeneratingA2uiToolCall,
  shouldShowA2uiCanvasBadge,
  turnHasInProgressA2uiActivity
} from '../lib/a2ui-tools'
import {
  getInlineStandardToolCalls,
  groupMessagesIntoTurns,
  turnHasFoldableWork
} from '../lib/group-chat-turns'
import { resolveTurnGenerativeToolCalls, resolveTurnToolCalls } from '../lib/group-tool-calls'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatAssistantActions } from './chat-assistant-actions'
import { ChatCanvasBadge, ChatCanvasGeneratingBadge } from './chat-canvas-badge'
import { ChatExportDownloads, ChatUserAttachments } from './chat-message-files'
import { ChatReasoningTrace } from './chat-reasoning-trace'
import { ChatUserActions } from './chat-user-actions'
import { ChatWorkTrace } from './chat-work-trace'
import { GroupedToolCallsView } from './grouped-tool-calls-view'

import type { Message as AGUIMessage } from '@copilotkit/react-core/v2'
import type { ChatTurnMessageLike } from '../lib/group-chat-turns'

export type ChatMessageLike = AGUIMessage &
  ChatTurnMessageLike & {
    toolCalls?: ChatTurnMessageLike['toolCalls']
  }

export function UserMessageItem({ message }: { message: ChatMessageLike }) {
  const text = useMemo(() => visibleChatText(message.content), [message.content])
  if (!text && listChatAttachments(message.content).length === 0) return null

  return (
    <Message from="user" className="max-w-full">
      <ChatUserAttachments content={message.content} />
      {text ? (
        <MessageContent className="text-base group-[.is-user]:max-w-7/10 group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-none group-[.is-user]:bg-primary/90 group-[.is-user]:px-3 group-[.is-user]:py-2 group-[.is-user]:text-primary-foreground/75">
          <MessageResponse>{text}</MessageResponse>
        </MessageContent>
      ) : null}
      {text ? <ChatUserActions text={text} /> : null}
    </Message>
  )
}

export interface AssistantMessageItemProps {
  message: ChatMessageLike
  messages: ChatMessageLike[]
  isRunning: boolean
  isLastAssistant: boolean
  includeInlineTools?: boolean
  showWorkingPlaceholder?: boolean
  /** 为 false 时不展示画布生成态和画布入口。Popup 没有右侧画布。 */
  showCanvas?: boolean
  /** 为 false 时不在这条消息上挂生成式结果。轨迹内的步骤改由回合统一放到外面。 */
  showGenerative?: boolean
  /** 工作轨迹里的过程说明，和轨迹外的最终回复区分开。 */
  placement?: 'answer' | 'work'
  onRetry?: () => void
}

export function AssistantMessageItem({
  message,
  messages,
  isRunning,
  isLastAssistant,
  includeInlineTools = true,
  showWorkingPlaceholder = false,
  showCanvas = true,
  showGenerative = true,
  placement = 'answer',
  onRetry
}: AssistantMessageItemProps) {
  const isStopped = useAgentChatInputStore((state) =>
    message.id ? state.stoppedMessageIds.has(message.id) : false
  )
  const content = typeof message.content === 'string' ? message.content : ''
  const isStreaming = isRunning && isLastAssistant
  const hasContent = Boolean(content.trim())
  const toolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : []
  const inlineStandardToolCalls = useMemo(
    () => (includeInlineTools ? getInlineStandardToolCalls(toolCalls) : []),
    [includeInlineTools, toolCalls]
  )
  const turnA2uiTools = useMemo(
    () =>
      message.id
        ? resolveTurnToolCalls(messages, message.id, (toolCall) =>
            shouldShowA2uiCanvasBadge(toolCall, messages, isRunning)
          )
        : null,
    [isRunning, message.id, messages]
  )
  const turnGenerativeTools = useMemo(
    () => (message.id ? resolveTurnGenerativeToolCalls(messages, message.id) : null),
    [message.id, messages]
  )
  const showA2uiSlot = Boolean(turnA2uiTools?.shouldRender && turnA2uiTools.toolCalls.length > 0)
  const showGenerativeSlot = Boolean(
    showGenerative && turnGenerativeTools?.shouldRender && turnGenerativeTools.toolCalls.length > 0
  )
  const canvasGeneration = useMemo(() => {
    if (!showCanvas || !isRunning || !isLastAssistant || !message.id || showA2uiSlot) {
      return undefined
    }
    return (
      findTurnGeneratingA2uiToolCall(messages, message.id) ??
      (turnHasInProgressA2uiActivity(messages, message.id) ? null : undefined)
    )
  }, [isLastAssistant, isRunning, message.id, messages, showA2uiSlot, showCanvas])
  const showCanvasPending = canvasGeneration !== undefined && !showGenerativeSlot

  const hasInlineTools = inlineStandardToolCalls.length > 0
  const showStreamingPlaceholder = Boolean(!hasContent && isStreaming && showWorkingPlaceholder)
  if (
    !hasContent &&
    !hasInlineTools &&
    !showA2uiSlot &&
    !showGenerativeSlot &&
    !showStreamingPlaceholder &&
    !isStopped
  ) {
    return null
  }

  return (
    <Message from="assistant" className="max-w-full">
      <MessageContent
        className={cn(
          'w-full transition-all duration-300 group-[.is-assistant]:w-full',
          placement === 'work' ? 'text-sm' : 'text-base'
        )}
      >
        {hasContent && (
          <MessageResponse
            animated
            isAnimating={isStreaming}
            caret={isStreaming ? 'block' : undefined}
          >
            {content}
          </MessageResponse>
        )}
        {hasInlineTools && (
          <GroupedToolCallsView
            placement="work"
            toolCalls={inlineStandardToolCalls}
            messages={messages as never}
          />
        )}
        {showStreamingPlaceholder && (
          <div className="my-1.5 flex items-center gap-2 py-0.5 text-muted-foreground">
            <Sparkles className="size-3.5 animate-pulse text-primary/70" />
            <Shimmer duration={1.5} className="text-xs font-normal text-muted-foreground">
              工作中...
            </Shimmer>
          </div>
        )}
        {isStopped && !isRunning && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/75">
            <span className="inline-block size-1.5 rounded-full bg-muted-foreground/50" />
            <span>已停止生成</span>
          </div>
        )}
      </MessageContent>
      {showCanvasPending && (
        <ChatCanvasGeneratingBadge
          title={canvasGeneration ? resolveStreamingCanvasTitle(canvasGeneration) : undefined}
        />
      )}
      {showCanvas && showA2uiSlot && turnA2uiTools && (
        <ChatCanvasBadge toolCalls={turnA2uiTools.toolCalls} messages={messages as never} />
      )}
      {showGenerativeSlot && turnGenerativeTools && (
        <div className="w-full">
          <GroupedToolCallsView
            toolCalls={turnGenerativeTools.toolCalls}
            messages={messages as never}
          />
        </div>
      )}
      {isLastAssistant && !isRunning && onRetry && (
        <ChatAssistantActions content={content} onRetry={onRetry} isRunning={isRunning} />
      )}
    </Message>
  )
}

export function ReasoningMessageItem({
  message,
  isRunning,
  isLatest
}: {
  message: ChatMessageLike
  isRunning: boolean
  isLatest: boolean
}) {
  const content = typeof message.content === 'string' ? message.content : ''
  const isStreaming = Boolean(isRunning && isLatest)
  const hasContent = Boolean(content.length)
  const timing = readZenMessageTiming(message.metadata)
  const duration = useReasoningDuration(message.id, isStreaming, timing)

  if (!hasContent && !isStreaming) return null

  return <ChatReasoningTrace content={content} isStreaming={isStreaming} duration={duration} />
}

function lastTurnAssistant(turn: {
  foldedBefore: ChatMessageLike[]
  foldedAfter: ChatMessageLike[]
  finalAssistant?: ChatMessageLike
}): ChatMessageLike | undefined {
  const ordered = [
    ...turn.foldedBefore,
    ...(turn.finalAssistant ? [turn.finalAssistant] : []),
    ...turn.foldedAfter
  ]
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const message = ordered[index]
    if (message?.role === 'assistant') return message
  }
  return undefined
}

/** 画布入口和生成式结果挂在轨迹外面，收起工作过程时仍然可见。 */
function TurnSurface({
  messages,
  anchorId,
  isRunning,
  showCanvas
}: {
  messages: ChatMessageLike[]
  anchorId?: string
  isRunning: boolean
  showCanvas: boolean
}) {
  const turnA2uiTools = useMemo(
    () =>
      anchorId
        ? resolveTurnToolCalls(messages, anchorId, (toolCall) =>
            shouldShowA2uiCanvasBadge(toolCall, messages, isRunning)
          )
        : null,
    [anchorId, isRunning, messages]
  )
  const turnGenerativeTools = useMemo(
    () => (anchorId ? resolveTurnGenerativeToolCalls(messages, anchorId) : null),
    [anchorId, messages]
  )
  const showA2uiSlot = Boolean(turnA2uiTools?.shouldRender && turnA2uiTools.toolCalls.length > 0)
  const showGenerativeSlot = Boolean(
    turnGenerativeTools?.shouldRender && turnGenerativeTools.toolCalls.length > 0
  )
  const generatingToolCall = useMemo(
    () => (anchorId ? findTurnGeneratingA2uiToolCall(messages, anchorId) : undefined),
    [anchorId, messages]
  )
  const showCanvasPending =
    showCanvas &&
    isRunning &&
    !showA2uiSlot &&
    (Boolean(generatingToolCall) ||
      Boolean(anchorId && turnHasInProgressA2uiActivity(messages, anchorId)))

  if (!showCanvasPending && !showA2uiSlot && !showGenerativeSlot) return null

  return (
    <>
      {showCanvasPending && (
        <ChatCanvasGeneratingBadge title={resolveStreamingCanvasTitle(generatingToolCall)} />
      )}
      {showCanvas && showA2uiSlot && turnA2uiTools && (
        <ChatCanvasBadge toolCalls={turnA2uiTools.toolCalls} messages={messages as never} />
      )}
      {showGenerativeSlot && turnGenerativeTools && (
        <GroupedToolCallsView
          toolCalls={turnGenerativeTools.toolCalls}
          messages={messages as never}
        />
      )}
    </>
  )
}

function FoldedTurnMessages({
  messages,
  foldedMessages,
  isRunning,
  isLastTurn
}: {
  messages: ChatMessageLike[]
  foldedMessages: ChatMessageLike[]
  isRunning: boolean
  isLastTurn: boolean
}) {
  const { renderActivityMessage } = useRenderActivityMessage()
  const lastMessageId = messages.at(-1)?.id

  return (
    <>
      {foldedMessages.map((message, idx) => (
        <Fragment key={message.id ?? `folded-${idx}`}>
          {message.role === 'assistant' && (
            <AssistantMessageItem
              message={message}
              messages={messages}
              isRunning={isRunning}
              isLastAssistant={false}
              includeInlineTools
              placement="work"
              showCanvas={false}
              showGenerative={false}
            />
          )}
          {message.role === 'reasoning' && (
            <ReasoningMessageItem
              message={message}
              isRunning={isRunning}
              isLatest={isLastTurn && message.id === lastMessageId}
            />
          )}
          {message.role === 'activity' &&
            message.activityType !== A2UI_ACTIVITY_TYPE &&
            renderActivityMessage(message as never)}
        </Fragment>
      ))}
    </>
  )
}

export function ChatMessages() {
  const { agent } = useChatAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { runError, retryLastRun, failedUserMessage } = useAgentRetry()

  const rawMessages = agent.messages as ChatMessageLike[]
  const messages = useMemo(() => {
    if (failedUserMessage && !rawMessages.some((m) => m.id === failedUserMessage.id)) {
      return [failedUserMessage as ChatMessageLike, ...rawMessages]
    }
    return rawMessages
  }, [failedUserMessage, rawMessages])

  const turns = useMemo(
    () => groupMessagesIntoTurns(messages, { liveRun: agent.isRunning }),
    [agent.isRunning, messages]
  )
  const lastUserIndex = messages.findLastIndex((m) => m.role === 'user')
  const messagesAfterUser = lastUserIndex >= 0 ? messages.slice(lastUserIndex + 1) : []
  const hasActiveAssistantOutput = messagesAfterUser.some((message) => {
    if (message.role === 'assistant') {
      const hasText = typeof message.content === 'string' && message.content.trim().length > 0
      const hasTools = Array.isArray(message.toolCalls) && message.toolCalls.length > 0
      return hasText || hasTools
    }
    if (message.role === 'reasoning') {
      return typeof message.content === 'string' && message.content.length > 0
    }
    return message.role === 'activity'
  })

  const isRunWaiting = agent.isRunning && !hasActiveAssistantOutput
  const canRetry = messages.some((m) => m.role === 'user')

  const handleRetry = () => {
    void retryLastRun(messages)
  }

  if (messages.length === 0) {
    if (runError) {
      return (
        <div className="flex flex-col gap-4">
          <ChatRunError
            message={runError}
            onRetry={handleRetry}
            disabled={agent.isRunning || !canRetry}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, turnIndex) => {
        const isLastTurn = turnIndex === turns.length - 1
        const hasWork = turnHasFoldableWork(turn)
        const isWaiting = isLastTurn && isRunWaiting
        const isWorking = isLastTurn && agent.isRunning && hasWork
        const finalInlineTools = getInlineStandardToolCalls(turn.finalAssistant?.toolCalls)

        return (
          <Fragment key={turn.key}>
            {turn.user && <UserMessageItem message={turn.user} />}
            {(hasWork || isWaiting) && (
              <ChatWorkTrace
                turnKey={turn.key}
                isWaiting={isWaiting}
                isWorking={isWorking}
                workStartedAt={readZenMessageTiming(turn.user?.metadata)?.workStartedAt}
                workEndedAt={readZenMessageTiming(turn.user?.metadata)?.workEndedAt}
              >
                <FoldedTurnMessages
                  messages={messages}
                  foldedMessages={turn.foldedBefore}
                  isRunning={agent.isRunning}
                  isLastTurn={isLastTurn}
                />
                {finalInlineTools.length > 0 && (
                  <GroupedToolCallsView
                    placement="work"
                    toolCalls={finalInlineTools}
                    messages={messages as never}
                  />
                )}
                <FoldedTurnMessages
                  messages={messages}
                  foldedMessages={turn.foldedAfter}
                  isRunning={agent.isRunning}
                  isLastTurn={isLastTurn}
                />
              </ChatWorkTrace>
            )}
            {turn.finalAssistant && (
              <AssistantMessageItem
                message={turn.finalAssistant}
                messages={messages}
                isRunning={agent.isRunning}
                isLastAssistant={isLastTurn}
                includeInlineTools={false}
                showCanvas={false}
                showGenerative={false}
                showWorkingPlaceholder={!hasWork}
                onRetry={handleRetry}
              />
            )}
            <TurnSurface
              messages={messages}
              anchorId={lastTurnAssistant(turn)?.id}
              isRunning={isLastTurn && agent.isRunning}
              showCanvas
            />
            <ChatExportDownloads contents={contentsForTurn(messages, turns, turnIndex)} />
          </Fragment>
        )
      })}
      {runError && (
        <ChatRunError
          message={runError}
          onRetry={handleRetry}
          disabled={agent.isRunning || !canRetry}
        />
      )}
    </div>
  )
}

function contentsForTurn(
  messages: ChatMessageLike[],
  turns: Array<{ user?: ChatMessageLike }>,
  index: number
) {
  const startId = turns[index]?.user?.id
  const nextId = turns[index + 1]?.user?.id
  const start = startId ? messages.findIndex((item) => item.id === startId) : 0
  const end = nextId ? messages.findIndex((item) => item.id === nextId) : messages.length
  return messages
    .slice(start < 0 ? 0 : start, end < 0 ? messages.length : end)
    .map((item) => item.content)
}

interface ChatRunErrorProps {
  message: string
  onRetry: () => void
  disabled: boolean
}

function ChatRunError({ message, onRetry, disabled }: ChatRunErrorProps) {
  const [title, ...rest] = message.split('：')
  const detail = rest.join('：')

  return (
    <Message from="assistant">
      <MessageContent>
        <div className="flex flex-col items-start gap-2">
          <Alert variant="destructive" className="max-w-max">
            <AlertCircle />
            <AlertTitle>{title}</AlertTitle>
            {detail ? <AlertDescription>{detail}</AlertDescription> : null}
          </Alert>
          <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={disabled}>
            <RefreshCw data-icon="inline-start" />
            重试
          </Button>
        </div>
      </MessageContent>
    </Message>
  )
}
