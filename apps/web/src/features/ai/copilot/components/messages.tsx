import { AITable } from '@/components/ai'

import AIMessage from './ai-message'
import { HumanMessage } from './human-message'

import type { ChatStatus, UIMessage } from 'ai'

interface ToolOutputItem {
  profile: {
    username: string
    nickname: string
  }
  contact: {
    email: string
  }
}

interface ToolOutput {
  items: ToolOutputItem[]
}

const isToolOutput = (value: unknown): value is ToolOutput => {
  if (!value || typeof value !== 'object') return false

  const maybeOutput = value as Partial<ToolOutput>
  return Array.isArray(maybeOutput.items)
}

const parseToolOutput = (output: unknown): ToolOutput | null => {
  if (typeof output !== 'string') return null

  try {
    const parsed: unknown = JSON.parse(output)
    return isToolOutput(parsed) ? parsed : null
  } catch {
    return null
  }
}

interface MessagesProps {
  parts: UIMessage['parts']
  role: UIMessage['role']
  status?: ChatStatus
}

export function Messages({ parts, role, status }: MessagesProps) {
  const isUserRole = role === 'user'
  const isAssistantRole = role === 'assistant'

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          if (isUserRole) return <HumanMessage key={i} message={part.text} />
          if (isAssistantRole)
            return <AIMessage key={i} message={part.text} isAnimating={status === 'streaming'} />

          return null
        }

        if (part.type === 'dynamic-tool') {
          if (part.state !== 'output-available') return <p>'正在渲染组件...'</p>

          const output = parseToolOutput(part.output)
          if (!output) return <p>'数据格式错误'</p>

          const data = output.items.map((item) => ({
            username: item.profile.username,
            nickname: item.profile.nickname,
            email: item.contact.email,
            phoneNumber: 'unknown'
          }))

          return <AITable key={i} data={data} />
        }

        return null
      })}
    </>
  )
}
