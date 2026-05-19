import { useAgent } from '@copilotkit/react-core/v2'
import { Conversation, ConversationContent, ConversationScrollButton, cn } from '@zen/ui'

import { ChatInput } from './chat-input'
// import { ChartInputV2 } from './chat-input-v2'
import { ChatMessages } from './chat-messages'

export default function ChatConversation() {
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
            'sticky bottom-0 pb-6 bg-background rounded-tl-xl rounded-tr-xl z-10',
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
