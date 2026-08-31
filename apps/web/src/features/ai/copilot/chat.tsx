import { useAgent } from '@copilotkit/react-core/v2'
import { Conversation, ConversationContent, ConversationScrollButton, cn } from '@zen/ui'

import { AppHeader, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'

import { ChatGreeting } from './components/chat-greeting'
import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { ChatRegistrations } from './components/registrations'

export function CopilotChat() {
  return (
    <>
      <AppHeader />

      <Main fixed fluid className="p-0">
        <ChatRegistrations />
        <Chat />
      </Main>
    </>
  )
}

function Chat() {
  const { agent } = useAgent()
  const [inputDockRef, inputDockHeight] = useElementHeight<HTMLDivElement>()
  const hasMessages = agent.messages.length > 0

  return (
    <div className="h-full flex flex-col relative">
      <Conversation>
        <ConversationContent>
          <div
            className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl"
            style={{ paddingBottom: inputDockHeight }}
          >
            <ChatMessages />
          </div>
        </ConversationContent>
        <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
      </Conversation>

      <div
        ref={inputDockRef}
        className={cn(
          'absolute bottom-0 z-10 inset-x-0 w-full px-6',
          !hasMessages && 'bottom-1/2 translate-y-1/2'
        )}
      >
        <div className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl relative pb-4">
          {!hasMessages && <ChatGreeting className="relative z-10" />}
          <ChatInput className="relative z-10" />
          <div className="pointer-events-none absolute inset-0 z-0  w-full ">
            <div className="bg-background h-full w-full backdrop-blur-xl mask-[linear-gradient(to_top,black_50%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_85%)] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
