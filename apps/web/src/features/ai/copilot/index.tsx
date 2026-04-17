import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

import { Main } from '@/components/layouts'

import { Messages } from './components/messages'
import { NotionPromptForm } from './components/notion-prompt-form'

const CHAT_API = 'http://127.0.0.1:3100/api/copilot'

export function AICopilot() {
  const transport = new DefaultChatTransport({
    api: CHAT_API
  })

  const { messages, sendMessage, status } = useChat({
    transport,

    onData: (message) => {
      console.log('Received message:', message)
    },

    onFinish: (options) => {
      console.log('Chat finished', options)
    }
  })

  const handleSendMessage = async (value: string) => {
    await sendMessage({ text: value })
  }

  return (
    <Main className="relative flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex-1 ">
        {messages.map((m) => (
          <Messages key={m.id} parts={m.parts} status={status} role={m.role} />
        ))}
      </div>

      <NotionPromptForm
        className="sticky bottom-6 bg-background md:bottom-8"
        onSubmit={handleSendMessage}
      />
    </Main>
  )
}
