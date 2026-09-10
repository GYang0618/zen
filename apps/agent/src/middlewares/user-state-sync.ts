import { Command } from '@langchain/langgraph'
import { createMiddleware } from 'langchain'

import { AgentStateSchema } from '@/schema/state'

import type { User } from '@/schema/state'

function isSuccessResponse(response: unknown): boolean {
  try {
    const rawContent = (response as { content?: unknown })?.content
    const content = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    if (!content) return true
    if (typeof content.code === 'number' && content.code >= 400) return false
    if (content.success === false) return false
    return true
  } catch {
    return true
  }
}

function extractResponseData(response: unknown): unknown {
  try {
    const rawContent = (response as { content?: unknown })?.content
    const content = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    return content?.data ?? content
  } catch {
    return undefined
  }
}

export const userStateSyncMiddleware = createMiddleware({
  name: 'userStateSyncMiddleware',
  stateSchema: AgentStateSchema,
  wrapToolCall: async (request, handler) => {
    const response = await handler(request)
    const toolName = request.toolCall.name

    if (toolName === 'query_users_list') {
      try {
        const data = extractResponseData(response) as { items?: User[] } | undefined
        const items = Array.isArray(data?.items) ? data.items : []
        const statusArg = (request.toolCall.args as { status?: string })?.status
        const isInactive = statusArg === 'suspended' || statusArg === 'inactive'

        return new Command({
          update: {
            ...(isInactive ? { inactive_users: items } : {}),
            users: items,
            messages: [response]
          }
        })
      } catch {
        return response
      }
    }

    if (toolName === 'update_user_info') {
      try {
        if (!isSuccessResponse(response)) return response

        const args = (request.toolCall.args ?? {}) as { id?: string; [key: string]: unknown }
        const { id, ...patch } = args
        if (!id) return response

        const currentInactive = (request.state as { inactive_users?: User[] })?.inactive_users ?? []
        const currentUsers = (request.state as { users?: User[] })?.users ?? []
        const responseData = (extractResponseData(response) ?? {}) as Partial<User>

        const patchUser = (u: User): User => {
          if (u.id !== id) return u
          return {
            ...u,
            ...(typeof responseData === 'object' &&
            responseData !== null &&
            !Array.isArray(responseData)
              ? responseData
              : {}),
            ...patch,
            updatedAt: new Date().toISOString()
          }
        }

        return new Command({
          update: {
            inactive_users: currentInactive.map(patchUser),
            users: currentUsers.map(patchUser),
            messages: [response]
          }
        })
      } catch {
        return response
      }
    }

    if (toolName === 'update_user_status') {
      try {
        if (!isSuccessResponse(response)) return response

        const args = (request.toolCall.args ?? {}) as { ids?: string[]; status?: string }
        const { ids = [], status } = args
        if (ids.length === 0 || !status) return response

        const currentInactive = (request.state as { inactive_users?: User[] })?.inactive_users ?? []
        const currentUsers = (request.state as { users?: User[] })?.users ?? []
        const isActivated = status === 'active'

        const newInactive = isActivated
          ? currentInactive.filter((u) => !ids.includes(u.id))
          : currentInactive.map((u) =>
              ids.includes(u.id)
                ? ({ ...u, status, updatedAt: new Date().toISOString() } as User)
                : u
            )

        const newUsers = currentUsers.map((u) =>
          ids.includes(u.id) ? ({ ...u, status, updatedAt: new Date().toISOString() } as User) : u
        )

        return new Command({
          update: {
            inactive_users: newInactive,
            users: newUsers,
            messages: [response]
          }
        })
      } catch {
        return response
      }
    }

    if (toolName === 'delete_users' || toolName === 'hard_delete_users') {
      try {
        if (!isSuccessResponse(response)) return response

        const ids: string[] = (request.toolCall.args as { ids?: string[] })?.ids ?? []
        const currentInactive =
          (request.state as { inactive_users?: Array<{ id: string }> })?.inactive_users ?? []
        const currentUsers = (request.state as { users?: Array<{ id: string }> })?.users ?? []

        return new Command({
          update: {
            inactive_users: currentInactive.filter((u) => !ids.includes(u.id)),
            users: currentUsers.filter((u) => !ids.includes(u.id)),
            messages: [response]
          }
        })
      } catch {
        return response
      }
    }

    if (toolName === 'restore_deleted_users') {
      try {
        if (!isSuccessResponse(response)) return response

        const ids: string[] = (request.toolCall.args as { ids?: string[] })?.ids ?? []
        const currentUsers = (request.state as { users?: User[] })?.users ?? []

        return new Command({
          update: {
            users: currentUsers.map((u) =>
              ids.includes(u.id)
                ? ({ ...u, status: 'active', updatedAt: new Date().toISOString() } as User)
                : u
            ),
            messages: [response]
          }
        })
      } catch {
        return response
      }
    }

    if (toolName === 'create_user') {
      try {
        if (!isSuccessResponse(response)) return response

        const createdUser = extractResponseData(response) as User | undefined
        if (createdUser && typeof createdUser.id === 'string') {
          const currentUsers = (request.state as { users?: User[] })?.users ?? []
          return new Command({
            update: {
              users: [createdUser, ...currentUsers.filter((u) => u.id !== createdUser.id)],
              messages: [response]
            }
          })
        }
      } catch {
        return response
      }
    }

    return response
  }
})
