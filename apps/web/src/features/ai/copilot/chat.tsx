import { Conversation, ConversationContent, ConversationScrollButton } from '@zen/ui'
import { useLayoutEffect, useRef, useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'

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

function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const updateHeight = () => {
      setHeight(node.getBoundingClientRect().height)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, height] as const
}

function Chat() {
  const [inputDockRef, inputDockHeight] = useElementHeight<HTMLDivElement>()

  return (
    <div className="h-full flex flex-col relative">
      <Conversation>
        <ConversationContent>
          <div
            className="@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl"
            style={{ paddingBottom: inputDockHeight }}
          >
            <ChatMessages />
          </div>
        </ConversationContent>
        <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
      </Conversation>

      <div ref={inputDockRef} className="absolute bottom-0 z-10 inset-x-0 w-full px-6">
        <div className="@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl relative pb-4">
          <ChatInput className="relative z-10" />
          <div className="pointer-events-none absolute inset-0 z-0  w-full ">
            <div className="bg-background h-full w-full backdrop-blur-xl mask-[linear-gradient(to_top,black_50%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_85%)] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
