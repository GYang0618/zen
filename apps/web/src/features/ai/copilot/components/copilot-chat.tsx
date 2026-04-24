import { useLayoutEffect, useRef } from 'react'

import { useCopilot } from '../copilot-provider'
import { Messages } from './messages'
import { NotionPromptForm } from './notion-prompt-form'

export function CopilotChat() {
  const { messages, sendMessage, status } = useCopilot()
  const chatRef = useRef<HTMLDivElement>(null)
  const handleSendMessage = async (value: string) => {
    await sendMessage({ text: value })
  }

  useLayoutEffect(() => {
    if (!messages.length) return

    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: status === 'streaming' ? 'auto' : 'smooth'
      })
    }
  }, [messages, status])

  return (
    <div ref={chatRef} className="relative h-full overflow-y-auto">
      <div className="h-full flex flex-col px-4 pt-6 gap-6  @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl ">
        <div className="flex-1">
          {messages.map((message) => (
            <Messages key={message.id} {...message} />
          ))}
        </div>
        <div className={'sticky w-full bottom-0 pb-6 bg-background rounded-tl-xl rounded-tr-xl'}>
          <NotionPromptForm onSubmit={handleSendMessage} />
        </div>
      </div>
    </div>
  )
}
