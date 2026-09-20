'use client'

import { A2UI_SURFACE_TOOL_NAMES } from '@zen/shared'
import { useEffect, useMemo, useRef } from 'react'

import { parseToolCallArguments } from '../lib/group-tool-calls'
import { useAgentGenerativePanelStore } from '../stores/agent-generative-panel'
import { assembleRenderA2uiOperations } from './assemble-operations'
import { readA2uiArgsTitle } from './resolve-a2ui-title'

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
  content?: unknown
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

function readRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return undefined
    }
  }
  return undefined
}

function readOperations(value: unknown): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value) || value.length === 0) return null
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object' && !Array.isArray(item)
  )
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
      }
    }
  }
  return '动态生成界面'
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
      const content = readRecord(activityMsg.content)
      const rawOps = readOperations(content?.a2ui_operations)
      if (rawOps && rawOps.length > 0) {
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
            const assistantMsg = m as AssistantMessageLike
            if (assistantMsg.role === 'assistant' && Array.isArray(assistantMsg.toolCalls)) {
              for (const toolCall of assistantMsg.toolCalls) {
                if (!toolCall.id) continue
                if (toolCall.function?.arguments?.includes(opSurfaceId)) {
                  matchedToolCallId = toolCall.id
                  break
                }
              }
              if (matchedToolCallId) break
            }
          }

          if (matchedToolCallId) {
            seenSurfaceIds.add(`a2ui-${matchedToolCallId}`)
          }

          surfaces.push({
            surfaceId: opSurfaceId,
            title: inferSurfaceTitle(rawOps),
            toolCallId: matchedToolCallId,
            activityId: activityMsg.id,
            isExecuting: Boolean(isRunning && content?.status === 'building'),
            operations: rawOps
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

      if (name && (A2UI_SURFACE_TOOL_NAMES as readonly string[]).includes(name)) {
        const fallbackSurfaceId = `a2ui-${toolCallId}`
        if (seenSurfaceIds.has(fallbackSurfaceId)) continue

        const args = parseToolCallArguments(toolCall) ?? {}
        if (args.display === false) continue

        const explicitTitle = readA2uiArgsTitle(args)
        let title = explicitTitle ?? '生成式界面'
        let operations: Array<Record<string, unknown>> | null = null

        const toolResultMsg = messages.find(
          (m) =>
            m &&
            typeof m === 'object' &&
            (m as ToolMessageLike).role === 'tool' &&
            (m as ToolMessageLike).toolCallId === toolCallId
        ) as ToolMessageLike | undefined

        if (toolResultMsg?.content) {
          const parsed = readRecord(toolResultMsg.content)
          operations = readOperations(parsed?.a2ui_operations)
        }

        if (!operations) {
          operations = assembleRenderA2uiOperations(args, fallbackSurfaceId)
        }

        if (!operations || operations.length === 0) continue

        if (!explicitTitle) {
          title = inferSurfaceTitle(operations)
        }

        const actualOpSurfaceId = getOperationSurfaceId(operations[0])

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

        seenSurfaceIds.add(finalSurfaceId)
        seenSurfaceIds.add(fallbackSurfaceId)
        surfaces.push({
          surfaceId: finalSurfaceId,
          title,
          toolCallId,
          isExecuting: false,
          operations
        })
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
    if (activeToolCallId) {
      const byToolCall = surfaces.find((s) => s.toolCallId === activeToolCallId)
      if (byToolCall) return byToolCall
    }
    if (activeSurfaceId) {
      const bySurface = surfaces.find(
        (s) => s.surfaceId === activeSurfaceId || s.toolCallId === activeSurfaceId
      )
      if (bySurface) return bySurface
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
