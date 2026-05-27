import { useAgent } from '@copilotkit/react-core/v2'
import { Conversation, ConversationContent, ConversationScrollButton, cn } from '@zen/ui'

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { ChatRegistrations } from './registrations'

export function Chat() {
  return (
    <>
      <ChatRegistrations />
      <ChatConversation />
    </>
  )
}

function ChatConversation() {
  const { agent } = useAgent()
  const hasMessages = agent.messages.length > 0

  return (
    <Conversation>
      <ConversationContent className="h-full p-8 text-lg @7xl/content:mx-auto @7xl/content:w-full @5xl/content:max-w-5xl">
        <div className="relative flex-2">
          <ChatMessages />
        </div>

        <div
          className={cn(
            'sticky bottom-0 pb-6 bg-background rounded-tl-xl rounded-tr-xl z-10 transition-all duration-300',
            !hasMessages && 'flex-3'
          )}
        >
          {/* <ChartInputV2 /> */}
          <ChatInput />

          <ConversationScrollButton className="-top-12" />
        </div>
      </ConversationContent>
    </Conversation>
  )
}
