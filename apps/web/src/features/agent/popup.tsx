import {
  CopilotChatAssistantMessage,
  CopilotChatConfigurationProvider,
  CopilotChatInput,
  CopilotChatReasoningMessage,
  CopilotChatUserMessage,
  CopilotPopup as CopilotkitPopup,
  CopilotModalHeader,
  randomUUID,
  useCopilotChatConfiguration,
  useCopilotKit
} from '@copilotkit/react-core/v2'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { MessageCirclePlus, X } from 'lucide-react'
import { useCallback, useContext, useMemo, useState } from 'react'

import { AgentBackgroundRunner } from './components/agent-background-runner'
import { AgentLauncherButton } from './components/agent-launcher-button'
import { ChatGreeting } from './components/chat-greeting'
import {
  AssistantMessageItem,
  ReasoningMessageItem,
  UserMessageItem
} from './components/chat-messages'
import { PopupChatInput } from './components/popup-chat-input'
import { PopupChatRegistrations } from './components/registrations'
import { AgentPopupContext } from './context/agent-popup-context'
import { useAgentChatInputStore } from './stores/agent-chat-input'

import type {
  CopilotChatAssistantMessageProps,
  CopilotChatReasoningMessageProps,
  CopilotChatUserMessageProps
} from '@copilotkit/react-core/v2'
import type { ChatMessageLike } from './components/chat-messages'

const POPUP_WIDTH_PX = 440
const POPUP_HEIGHT_PX = 650

const PopupUserMessage = Object.assign(function PopupUserMessage({
  message
}: CopilotChatUserMessageProps) {
  return <UserMessageItem message={message as ChatMessageLike} />
}, CopilotChatUserMessage)

const PopupAssistantMessage = Object.assign(function PopupAssistantMessage({
  message,
  messages = [],
  isRunning = false,
  onRegenerate
}: CopilotChatAssistantMessageProps) {
  const isLastAssistant = messages.findLast((m) => m.role === 'assistant')?.id === message.id
  return (
    <AssistantMessageItem
      message={message as ChatMessageLike}
      messages={messages as ChatMessageLike[]}
      isRunning={isRunning}
      isLastAssistant={isLastAssistant}
      includeInlineTools
      showWorkingPlaceholder
      onRetry={onRegenerate ? () => onRegenerate(message) : undefined}
    />
  )
}, CopilotChatAssistantMessage)

const PopupReasoningMessage = Object.assign(function PopupReasoningMessage({
  message,
  messages = [],
  isRunning = false
}: CopilotChatReasoningMessageProps) {
  const isLatest = messages.findLast((m) => m.role === 'reasoning')?.id === message.id
  return (
    <ReasoningMessageItem
      message={message as ChatMessageLike}
      isRunning={isRunning}
      isLatest={isLatest}
    />
  )
}, CopilotChatReasoningMessage)

const PopupInput = Object.assign(PopupChatInput, CopilotChatInput)

const PopupHeader = Object.assign(function PopupHeader() {
  const configuration = useCopilotChatConfiguration()
  const popupContext = useContext(AgentPopupContext)

  return (
    <div className="flex items-center justify-end gap-1 px-3 pt-2.5 pb-1 select-none">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              onClick={popupContext?.onNewThread}
              aria-label="新建对话"
            />
          }
        >
          <MessageCirclePlus className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">新建对话</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              onClick={() => configuration?.setModalOpen(false)}
              aria-label="关闭"
            />
          }
        >
          <X className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">关闭</TooltipContent>
      </Tooltip>
    </div>
  )
}, CopilotModalHeader)

function PopupWelcomeScreen({
  input,
  suggestionView,
  className
}: {
  input: React.ReactNode
  suggestionView?: React.ReactNode
  className?: string
}) {
  const popupContext = useContext(AgentPopupContext)

  return (
    <div className={cn('flex h-full flex-col justify-between', className)}>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <ChatGreeting threadId={popupContext?.threadId} className="pb-0" />
      </div>
      <div className="w-full">
        {suggestionView}
        {input}
      </div>
    </div>
  )
}

export function AgentPopup() {
  const { copilotkit } = useCopilotKit()
  const [threadId, setThreadId] = useState(() => randomUUID())

  const handleNewThread = useCallback(() => {
    const nextThreadId = randomUUID()
    setThreadId(nextThreadId)
    const agent = copilotkit.getAgent('plan')
    if (agent) {
      agent.threadId = nextThreadId
      agent.setMessages([])
    }
    useAgentChatInputStore.getState().clearEditDraft()
    useAgentChatInputStore.getState().triggerNewThread()
  }, [copilotkit])

  const contextValue = useMemo(
    () => ({ threadId, onNewThread: handleNewThread }),
    [threadId, handleNewThread]
  )

  return (
    <AgentPopupContext.Provider value={contextValue}>
      <PopupChatRegistrations />
      <AgentBackgroundRunner activeThreadId={threadId} agentId="plan" />
      <CopilotChatConfigurationProvider
        threadId={threadId}
        hasExplicitThreadId={false}
        isModalDefaultOpen={false}
      >
        <CopilotkitPopup
          agentId="plan"
          defaultOpen={false}
          clickOutsideToClose
          width={POPUP_WIDTH_PX}
          height={POPUP_HEIGHT_PX}
          toggleButton={AgentLauncherButton}
          header={PopupHeader}
          messageView={{
            className: 'pt-2 px-4 pb-3 gap-4',
            userMessage: PopupUserMessage,
            assistantMessage: PopupAssistantMessage,
            reasoningMessage: PopupReasoningMessage
          }}
          input={PopupInput}
          welcomeScreen={PopupWelcomeScreen}
          labels={{
            modalHeaderTitle: 'AI 助手',
            chatInputPlaceholder: '输入你想问的任务问题',
            welcomeMessageText: '你好！有什么我可以帮你的吗？',
            chatDisclaimerText: 'AI可能会出错，请核实重要信息。'
          }}
        />
      </CopilotChatConfigurationProvider>
    </AgentPopupContext.Provider>
  )
}
