'use client'

import { useEffect, useMemo } from 'react'

import { isA2UIToolCall } from '../lib/a2ui-tools'
import { parseAgentToolResult } from '../lib/parse-agent-tool-result'
import { formatToolTitle } from '../lib/tool-title'
import { useAgentGenerativePanelStore } from '../stores/agent-generative-panel'

import type { User } from '@zen/shared'

export interface A2UISurfaceDescriptor {
  surfaceId: string
  title: string
  toolCallId?: string
  activityId?: string
  isExecuting: boolean
  operations: Array<Record<string, unknown>>
}

interface CopilotKitToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

interface ToolMessageLike {
  id: string
  role: string
  toolCallId?: string
  content?: unknown
}

interface ActivityMessageLike {
  id: string
  role: string
  activityType?: string
  content?: Record<string, unknown>
}

function isValidToolCall(toolCall: unknown): toolCall is CopilotKitToolCall {
  if (!toolCall || typeof toolCall !== 'object') return false
  const tc = toolCall as Record<string, unknown>
  const fn = tc.function as Record<string, unknown> | undefined
  return typeof tc.id === 'string' && typeof fn?.name === 'string'
}

function getOperationSurfaceId(op: unknown): string | null {
  if (!op || typeof op !== 'object') return null
  const record = op as Record<string, unknown>
  if (typeof record.surfaceId === 'string') return record.surfaceId
  const cs = record.createSurface as { surfaceId?: string } | undefined
  if (typeof cs?.surfaceId === 'string') return cs.surfaceId
  const uc = record.updateComponents as { surfaceId?: string } | undefined
  if (typeof uc?.surfaceId === 'string') return uc.surfaceId
  const ud = record.updateDataModel as { surfaceId?: string } | undefined
  if (typeof ud?.surfaceId === 'string') return ud.surfaceId
  return null
}

export function extractA2UISurfaces(
  messages: unknown[],
  isRunning: boolean
): A2UISurfaceDescriptor[] {
  const surfaces: A2UISurfaceDescriptor[] = []
  const toolMessages = (messages as ToolMessageLike[]).filter((m) => m && m.role === 'tool')

  for (const message of messages) {
    if (!message || typeof message !== 'object') continue
    const msg = message as {
      role?: string
      toolCalls?: unknown[]
    }

    // 1. 提取 A2UI 工具调用产生的 Surface
    if (msg.role === 'assistant' && Array.isArray(msg.toolCalls)) {
      for (const tc of msg.toolCalls) {
        if (!isValidToolCall(tc) || !isA2UIToolCall(tc)) continue

        const surfaceId = `a2ui-${tc.id}`
        const matchingToolMsg = toolMessages.find((m) => m.toolCallId === tc.id)
        const isExecuting = Boolean(
          (!matchingToolMsg || matchingToolMsg.content === undefined) && isRunning
        )

        let title = formatToolTitle(tc.function.name)
        let operations: Array<Record<string, unknown>> = []

        if (tc.function.name === 'query_users_list') {
          let userQueryParams: { status?: string; keyword?: string } | undefined
          try {
            userQueryParams = JSON.parse(tc.function.arguments || '{}')
          } catch {
            userQueryParams = undefined
          }

          const rawToolContent =
            matchingToolMsg?.content !== undefined
              ? typeof matchingToolMsg.content === 'string'
                ? matchingToolMsg.content
                : JSON.stringify(matchingToolMsg.content)
              : undefined

          const parsed = rawToolContent
            ? parseAgentToolResult<{ items?: User[] }>(rawToolContent, {
                status: isExecuting ? 'inProgress' : 'complete'
              })
            : undefined

          const isSuspended = userQueryParams?.status === 'suspended'
          title = isSuspended ? '已停用用户列表' : '用户列表'
          const stateKey = isSuspended ? 'inactive_users' : 'users'
          let users = parsed?.data?.items
          if (!users && rawToolContent) {
            try {
              const rawParsed = JSON.parse(rawToolContent)
              if (Array.isArray(rawParsed?.data?.items)) {
                users = rawParsed.data.items
              } else if (Array.isArray(rawParsed?.items)) {
                users = rawParsed.items
              }
            } catch {
              // ignore
            }
          }

          operations = [
            {
              version: 'v0.9',
              createSurface: {
                surfaceId,
                catalogId: 'copilotkit://custom-catalog'
              }
            },
            {
              version: 'v0.9',
              updateComponents: {
                surfaceId,
                components: [
                  {
                    id: 'root',
                    component: 'UserTable',
                    title,
                    stateKey,
                    users,
                    isLoading: isExecuting,
                    props: {
                      title,
                      stateKey,
                      users,
                      isLoading: isExecuting
                    }
                  }
                ]
              }
            }
          ]
        }

        surfaces.push({
          surfaceId,
          title,
          toolCallId: tc.id,
          isExecuting,
          operations
        })
      }
    }

    // 2. 提取原生 A2UI Activity 消息（activityType === 'a2ui-surface'）
    const activityMsg = message as ActivityMessageLike
    if (activityMsg.role === 'activity' && activityMsg.activityType === 'a2ui-surface') {
      const rawOps = activityMsg.content?.a2ui_operations
      if (Array.isArray(rawOps) && rawOps.length > 0) {
        const opSurfaceId = getOperationSurfaceId(rawOps[0]) || `a2ui-${activityMsg.id}`
        surfaces.push({
          surfaceId: opSurfaceId,
          title: '动态生成界面',
          activityId: activityMsg.id,
          isExecuting: Boolean(isRunning && activityMsg.content?.status === 'building'),
          operations: rawOps as Array<Record<string, unknown>>
        })
      }
    }
  }

  return surfaces
}

export function useA2UISurfaces(messages: unknown[], isRunning: boolean) {
  const activeSurfaceId = useAgentGenerativePanelStore((state) => state.activeSurfaceId)
  const setActiveSurfaceId = useAgentGenerativePanelStore((state) => state.setActiveSurfaceId)

  const surfaces = useMemo(() => {
    return extractA2UISurfaces(messages, isRunning)
  }, [messages, isRunning])

  const activeSurface = useMemo(() => {
    if (activeSurfaceId) {
      const found = surfaces.find((s) => s.surfaceId === activeSurfaceId)
      if (found) return found
    }
    return surfaces.at(-1)
  }, [surfaces, activeSurfaceId])

  useEffect(() => {
    if (activeSurface && activeSurface.surfaceId !== activeSurfaceId) {
      setActiveSurfaceId(activeSurface.surfaceId)
    }
  }, [activeSurface, activeSurfaceId, setActiveSurfaceId])

  return {
    surfaces,
    activeSurface,
    activeSurfaceId,
    setActiveSurfaceId
  }
}
