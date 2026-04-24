import type { DynamicToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import type { z } from 'zod'

/**
 * 所有状态的公共字段。
 */
export interface ToolUIStateBase<TInput> {
  toolName: string
  toolCallId: string
  /** 工具入参。`input-streaming` 阶段可能是部分/不完整数据。 */
  input: TInput
}

/**
 * 工具 UI 的状态机，与 AI SDK v6 `DynamicToolUIPart.state` 对齐，
 * 同时增加一个跨 state 的 `phase` 语义字段，便于做粗粒度分支。
 *
 * phase 映射：
 * - pending : input-streaming | input-available | approval-requested | approval-responded
 * - ready   : output-available（通过 schema 校验）
 * - error   : output-error / schema 校验失败 / render 抛错
 * - denied  : output-denied
 */
export type AssistantToolUIState<TInput, TData> = ToolUIStateBase<TInput> &
  (
    | {
        phase: 'pending'
        status: 'input-streaming' | 'input-available' | 'approval-requested' | 'approval-responded'
        approval?: Extract<DynamicToolUIPart, { approval: unknown }>['approval']
      }
    | {
        phase: 'ready'
        status: 'output-available'
        data: TData
        /** 原始 output（未经 schema 解析）。 */
        output: unknown
        /** `true` 表示当前是流式部分结果（对应 part.preliminary）。 */
        isPreliminary: boolean
      }
    | {
        phase: 'error'
        status: 'output-error' | 'schema-error' | 'render-error'
        error: Error
        /** 工具原始 errorText，仅 status='output-error' 存在。 */
        errorText?: string
        /** 原始 output，status='schema-error' | 'render-error' 时存在。 */
        output?: unknown
      }
    | {
        phase: 'denied'
        status: 'output-denied'
        reason?: string
      }
  )

export interface AssistantToolUIProps {
  part: DynamicToolUIPart
}

export interface AssistantToolUIComponent extends React.FC<AssistantToolUIProps> {
  toolName: string
}

export interface MakeAssistantToolUIOptions<
  TOutputSchema extends z.ZodType,
  TInputSchema extends z.ZodType | undefined = undefined
> {
  toolName: string
  /** 输出 schema，用于校验 tool 返回并推导 `data` 类型。 */
  outputSchema: TOutputSchema
  /** 可选入参 schema，用于推导 `input` 类型（不做强校验，失败时退化为 unknown）。 */
  inputSchema?: TInputSchema
  render: (
    state: AssistantToolUIState<
      TInputSchema extends z.ZodType ? z.infer<TInputSchema> : unknown,
      z.infer<TOutputSchema>
    >
  ) => ReactNode
}
