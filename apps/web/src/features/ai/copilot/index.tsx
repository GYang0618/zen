import { useChat } from '@ai-sdk/react'
import { Button } from '@zen/ui/index'
import { DefaultChatTransport } from 'ai'

import { Main } from '@/components/layouts'

export function AICopilot() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://127.0.0.1:3100/api/copilot'
    }),
    onData: (message) => {
      console.log('Received message:', message)
    }
  })

  const handleSendMessage = async () => {
    await sendMessage({ text: '你好' })
  }
  return (
    <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
      {/* <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User List</h2>
          <p className="text-muted-foreground">Manage your users and their roles here.</p>
        </div>
      </div> */}
      <div>
        消息：
        {messages.map((m) => (
          <div key={m.id}>
            {m.parts.map((part, i) =>
              part.type === 'text' ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
      </div>
      <Button onClick={handleSendMessage}>发送</Button>
    </Main>
  )
}
