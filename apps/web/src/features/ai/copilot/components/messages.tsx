import { getRouteApi } from '@tanstack/react-router'

import { UsersTable } from '@/features/system/users/components/users-table'
import { UsersProvider } from '@/features/system/users/users-provider'

import AIMessage from './ai-message'
import { HumanMessage } from './human-message'

import type { ChatStatus, UIMessage } from 'ai'
import type { User } from '@/features/system/users'
import type { PaginationResponse } from '@/lib/request'

type ToolOutput = PaginationResponse<User>

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
const route = getRouteApi('/_authenticated/ai/copilot')
export function Messages({ parts, role, status }: MessagesProps) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
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

          const { items, pagination } = output

          return (
            <UsersProvider key={i}>
              <UsersTable
                data={items}
                total={pagination.total}
                search={search}
                navigate={navigate}
              />
            </UsersProvider>
          )
        }

        return null
      })}
    </>
  )
}
