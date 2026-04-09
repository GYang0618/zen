import AIMessage from './ai-message'
import { HumanMessage } from './human-message'

import type { UIMessage } from 'ai'

interface MessagesProps {
  message: string
  role: UIMessage['role']
}

export function Messages({ message, role }: MessagesProps) {
  return (
    <>
      {role === 'user' && <HumanMessage message={message} />}
      {role === 'assistant' && <AIMessage message={message} />}
    </>
  )
}
