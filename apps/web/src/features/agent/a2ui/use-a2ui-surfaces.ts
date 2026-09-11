'use client'

import { useEffect, useMemo, useRef } from 'react'

import { useAgentGenerativePanelStore } from '../stores/agent-generative-panel'
import { ZEN_A2UI_CATALOG_ID } from './a2ui.constants'

export interface A2UISurfaceDescriptor {
  surfaceId: string
  title: string
  toolCallId?: string
  activityId?: string
  isExecuting: boolean
  operations: Array<Record<string, unknown>>
}

interface ActivityMessageLike {
  id?: string
  role?: string
  activityType?: string
  content?: Record<string, unknown>
}

interface AssistantMessageLike {
  id?: string
  role?: string
  toolCalls?: Array<{
    id?: string
    function?: {
      name?: string
      arguments?: string
    }
  }>
}

interface ToolMessageLike {
  id?: string
  role?: string
  toolCallId?: string
  content?: unknown
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

function inferSurfaceTitle(operations: Array<Record<string, unknown>>): string {
  for (const op of operations) {
    const ud = op.updateDataModel as { value?: { title?: string } } | undefined
    if (typeof ud?.value?.title === 'string' && ud.value.title) {
      return ud.value.title
    }
    const uc = op.updateComponents as
      | {
          components?: Array<{
            component?: string
            title?: string
            props?: { title?: string }
          }>
        }
      | undefined
    if (Array.isArray(uc?.components)) {
      for (const comp of uc.components) {
        if (typeof comp?.title === 'string' && comp.title) return comp.title
        if (typeof comp?.props?.title === 'string' && comp.props.title) return comp.props.title
        if (comp?.component === 'UserTable') return '用户列表'
      }
    }
  }
  return '动态生成界面'
}

function createFallbackUserTableOperations(
  surfaceId: string,
  title: string,
  stateKey: string,
  users: unknown[],
  isLoading: boolean
): Array<Record<string, unknown>> {
  const componentProps = {
    title,
    stateKey,
    users,
    isLoading
  }

  return [
    {
      version: 'v0.9',
      createSurface: {
        surfaceId,
        catalogId: ZEN_A2UI_CATALOG_ID
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
            ...componentProps,
            props: componentProps
          }
        ]
      }
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId,
        path: '/',
        value: {
          title,
          users,
          [stateKey]: users
        }
      }
    }
  ]
}

export function extractA2UISurfaces(
  messages: unknown[],
  isRunning: boolean
): A2UISurfaceDescriptor[] {
  const surfaces: A2UISurfaceDescriptor[] = []
  const seenSurfaceIds = new Set<string>()

  // 1. 优先提取原生的 activity 消息（通过 @ag-ui/a2ui-middleware 下发）
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue
    const activityMsg = message as ActivityMessageLike
    if (activityMsg.role === 'activity' && activityMsg.activityType === 'a2ui-surface') {
      const rawOps = activityMsg.content?.a2ui_operations
      if (Array.isArray(rawOps) && rawOps.length > 0) {
        const opSurfaceId = getOperationSurfaceId(rawOps[0]) || `a2ui-${activityMsg.id}`
        if (!seenSurfaceIds.has(opSurfaceId)) {
          seenSurfaceIds.add(opSurfaceId)

          // 尝试关联对应的 toolCallId（通过 tool 消息中包含相同 surfaceId）
          let matchedToolCallId: string | undefined
          for (const m of messages) {
            if (!m || typeof m !== 'object') continue
            const toolMsg = m as ToolMessageLike
            if (toolMsg.role === 'tool' && toolMsg.toolCallId && toolMsg.content) {
              try {
                const raw =
                  typeof toolMsg.content === 'string'
                    ? toolMsg.content
                    : JSON.stringify(toolMsg.content)
                if (raw.includes(opSurfaceId)) {
                  matchedToolCallId = toolMsg.toolCallId
                  break
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          if (matchedToolCallId) {
            seenSurfaceIds.add(`a2ui-${matchedToolCallId}`)
          }

          surfaces.push({
            surfaceId: opSurfaceId,
            title: inferSurfaceTitle(rawOps as Array<Record<string, unknown>>),
            toolCallId: matchedToolCallId,
            activityId: activityMsg.id,
            isExecuting: Boolean(isRunning && activityMsg.content?.status === 'building'),
            operations: rawOps as Array<Record<string, unknown>>
          })
        }
      }
    }
  }

  // 2. 补充提取 ToolCall / ToolMessage 对应的 A2UI 生成式组件（双重保障）
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue
    const assistantMsg = message as AssistantMessageLike
    if (assistantMsg.role !== 'assistant' || !Array.isArray(assistantMsg.toolCalls)) continue

    for (const toolCall of assistantMsg.toolCalls) {
      const name = toolCall.function?.name
      const toolCallId = toolCall.id
      if (!toolCallId) continue

      if (
        name === 'query_users_list' ||
        name === 'generate_dynamic_dashboard' ||
        name === 'render_a2ui'
      ) {
        const fallbackSurfaceId = `a2ui-${toolCallId}`
        if (seenSurfaceIds.has(fallbackSurfaceId)) continue

        let args: {
          status?: string | string[]
          keyword?: string
          display?: boolean
          title?: string
        } = {}
        try {
          args = JSON.parse(toolCall.function?.arguments || '{}')
        } catch {
          // 忽略解析错误
        }

        if (args.display === false) continue

        const isSuspended =
          args.status === 'suspended' ||
          (Array.isArray(args.status) && args.status.includes('suspended'))
        const stateKey = isSuspended ? 'inactive_users' : 'users'
        let title = args.title || (name === 'generate_dynamic_dashboard' ? '数据看板' : '用户列表')
        if (name === 'query_users_list') {
          if (isSuspended) {
            title = '已停用用户列表'
          } else if (args.keyword && args.keyword !== '@qq.com' && args.keyword !== 'qq.com') {
            title = `用户列表（搜索: ${args.keyword}）`
          }
        }

        // 查找对应的工具结果
        const toolResultMsg = messages.find(
          (m) =>
            m &&
            typeof m === 'object' &&
            (m as ToolMessageLike).role === 'tool' &&
            (m as ToolMessageLike).toolCallId === toolCallId
        ) as ToolMessageLike | undefined

        if (toolResultMsg?.content) {
          let operations: Array<Record<string, unknown>> | null = null
          let users: unknown[] = []

          try {
            const rawContent =
              typeof toolResultMsg.content === 'string'
                ? toolResultMsg.content
                : JSON.stringify(toolResultMsg.content)
            const parsed = JSON.parse(rawContent)

            // 优先读取显式返回的 a2ui_operations
            if (Array.isArray(parsed.a2ui_operations) && parsed.a2ui_operations.length > 0) {
              operations = parsed.a2ui_operations as Array<Record<string, unknown>>
              title = inferSurfaceTitle(operations)
            }

            // 读取 items
            const dataObj = parsed.data ?? parsed
            if (Array.isArray(dataObj.items)) {
              users = dataObj.items
            } else if (Array.isArray(dataObj)) {
              users = dataObj
            }
          } catch {
            // 保持容错
          }

          const actualOpSurfaceId =
            operations && operations.length > 0 ? getOperationSurfaceId(operations[0]) : null

          // 如果操作里的 surfaceId 已经被通道 1 提取过，关联 toolCallId 并跳过，彻底杜绝重复
          if (actualOpSurfaceId && seenSurfaceIds.has(actualOpSurfaceId)) {
            seenSurfaceIds.add(fallbackSurfaceId)
            const existing = surfaces.find((s) => s.surfaceId === actualOpSurfaceId)
            if (existing && !existing.toolCallId) {
              existing.toolCallId = toolCallId
            }
            continue
          }

          const finalSurfaceId = actualOpSurfaceId || fallbackSurfaceId
          if (seenSurfaceIds.has(finalSurfaceId)) continue

          if (!operations) {
            operations = createFallbackUserTableOperations(
              finalSurfaceId,
              title,
              stateKey,
              users,
              false
            )
          }

          seenSurfaceIds.add(finalSurfaceId)
          seenSurfaceIds.add(fallbackSurfaceId)
          surfaces.push({
            surfaceId: finalSurfaceId,
            title,
            toolCallId,
            isExecuting: false,
            operations
          })
        } else if (isRunning) {
          if (seenSurfaceIds.has(fallbackSurfaceId)) continue
          // 工具仍在执行中
          const operations = createFallbackUserTableOperations(
            fallbackSurfaceId,
            title,
            stateKey,
            [],
            true
          )
          seenSurfaceIds.add(fallbackSurfaceId)
          surfaces.push({
            surfaceId: fallbackSurfaceId,
            title,
            toolCallId,
            isExecuting: true,
            operations
          })
        }
      }
    }
  }

  return surfaces
}

export function useA2UISurfaces(messages: unknown[], isRunning: boolean) {
  const activeSurfaceId = useAgentGenerativePanelStore((state) => state.activeSurfaceId)
  const activeToolCallId = useAgentGenerativePanelStore((state) => state.activeToolCallId)
  const setActiveSurfaceId = useAgentGenerativePanelStore((state) => state.setActiveSurfaceId)
  const openSurface = useAgentGenerativePanelStore((state) => state.openSurface)
  const isOpen = useAgentGenerativePanelStore((state) => state.isOpen)

  const surfaces = useMemo(() => {
    return extractA2UISurfaces(messages, isRunning)
  }, [messages, isRunning])

  const activeSurface = useMemo(() => {
    if (activeSurfaceId || activeToolCallId) {
      const found = surfaces.find(
        (s) =>
          (activeSurfaceId &&
            (s.surfaceId === activeSurfaceId || s.toolCallId === activeSurfaceId)) ||
          (activeToolCallId && s.toolCallId === activeToolCallId)
      )
      if (found) return found
    }
    return surfaces.at(-1)
  }, [surfaces, activeSurfaceId, activeToolCallId])

  useEffect(() => {
    if (activeSurface && activeSurface.surfaceId !== activeSurfaceId) {
      setActiveSurfaceId(activeSurface.surfaceId)
    }
  }, [activeSurface, activeSurfaceId, setActiveSurfaceId])

  // 当生成式 Surface 首次产生且工作区处于闭合状态时，自动展开工作区
  const hasAutoOpenedRef = useRef(false)
  useEffect(() => {
    if (surfaces.length > 0 && !isOpen && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true
      if (activeSurface) {
        openSurface(activeSurface.surfaceId)
      }
    }
  }, [surfaces.length, isOpen, activeSurface, openSurface])

  return {
    surfaces,
    activeSurface,
    activeSurfaceId,
    setActiveSurfaceId
  }
}
