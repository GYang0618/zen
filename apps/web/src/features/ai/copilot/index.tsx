import { useChat } from '@ai-sdk/react'
import { ScrollArea } from '@zen/ui'
import { DefaultChatTransport } from 'ai'

import { AITable } from '@/components/ai'
import { Main } from '@/components/layouts'

import { Messages } from './components/messages'
import { NotionPromptForm } from './components/notion-prompt-form'

import type { User } from '@/components/ai'

export const data: User[] = [
  {
    username: '缪白',
    name: 'Miubai',
    email: '2559058772@qq.com',
    phoneNumber: '18554564566'
  }
]

export function AICopilot() {
  const transport = new DefaultChatTransport({
    api: 'http://127.0.0.1:3100/api/copilot'
  })

  const { messages, sendMessage } = useChat({ transport })

  const handleSendMessage = async (value: string) => {
    await sendMessage({ text: value })
  }

  return (
    <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
      <ScrollArea className="flex-1">
        {messages.map((m) => (
          <div key={m.id}>
            {m.parts.map((part, i) => {
              if (part.type !== 'text') return null
              return <Messages key={i} message={part.text} role={m.role} />
            })}
          </div>
        ))}

        {/* <AIForm /> */}
        <AITable data={data} />
      </ScrollArea>

      <NotionPromptForm onSubmit={handleSendMessage} />
    </Main>
  )
}
