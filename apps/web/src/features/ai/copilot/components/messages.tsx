import AIMessage from './ai-message'
import { HumanMessage } from './human-message'

import type { ChatStatus, UIMessage } from 'ai'

interface MessagesProps {
  parts: UIMessage['parts']
  role: UIMessage['role']
  status?: ChatStatus
}

export function Messages({ parts, role, status }: MessagesProps) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          if (role === 'user') return <HumanMessage key={i} message={part.text} />
          if (role === 'assistant')
            return <AIMessage key={i} message={part.text} isAnimating={status === 'streaming'} />
        }

        return null
      })}
    </>
  )
}
