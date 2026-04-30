import { Conversation, ConversationContent, ConversationScrollButton } from '@zen/ui'

import { Messages } from './messages'
import { NotionPromptForm } from './notion-prompt-form'

export function AIChat() {
  return (
    <Conversation>
      <ConversationContent className="h-full p-0 text-lg @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl">
        <div className="relative flex-1">
          <Messages />
        </div>

        <div className="sticky bottom-0 pb-6 bg-background rounded-tl-xl rounded-tr-xl">
          <NotionPromptForm />
          <ConversationScrollButton className="-top-12" />
        </div>
      </ConversationContent>
    </Conversation>
  )
}
