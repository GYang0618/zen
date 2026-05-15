import { Conversation, ConversationContent, ConversationScrollButton } from '@zen/ui'

import { ChatInput } from './chat-input'
import ChatMessages from './chat-messages'

export default function ChatConversation() {
  return (
    <Conversation>
      <ConversationContent className="h-full p-8 text-lg @7xl/content:mx-auto @7xl/content:w-full @5xl/content:max-w-5xl">
        <div className="relative flex-1">
          <ChatMessages />
        </div>

        <div className="sticky bottom-0 pb-6 bg-background rounded-tl-xl rounded-tr-xl">
          {/* <ChartInputV2 /> */}
          <ChatInput />

          <ConversationScrollButton className="-top-12" />
        </div>
      </ConversationContent>
    </Conversation>
  )
}
