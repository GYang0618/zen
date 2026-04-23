import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { createContext, useContext } from 'react'

import { useEnv } from '@/config/env'

import type { ReactNode } from 'react'

type ChatContextType = ReturnType<typeof useChat>

const ChatContext = createContext<ChatContextType | null>(null)

export function CopilotProvider({ children }: { children: ReactNode }) {
  const { chatApi } = useEnv()
  const transport = new DefaultChatTransport({
    api: chatApi
  })
  const chat = useChat({
    transport
    // onData: (message) => {
    //   console.log('Received message:', message)
    // },

    // onFinish: (options) => {
    //   console.log('Chat finished', options)
    // }
  })

  return <ChatContext value={{ ...chat }}>{children}</ChatContext>
}

export const useCopilot = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider')
  }
  return context
}
