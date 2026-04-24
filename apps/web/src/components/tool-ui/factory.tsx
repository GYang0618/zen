import type { z } from 'zod'
import type {
  AssistantToolUIComponent,
  AssistantToolUIProps,
  AssistantToolUIState,
  MakeAssistantToolUIOptions
} from './types'

// ─────────────────────────── 内部工具 ───────────────────────────

function normalizeOutput(output: unknown): unknown {
  if (typeof output !== 'string') return output
  const trimmed = output.trim()
  if (trimmed === '') return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return output
  }
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

// ─────────────────────────── 主工厂 ───────────────────────────

export function makeAssistantToolUI<
  TOutputSchema extends z.ZodType,
  TInputSchema extends z.ZodType | undefined = undefined
>(options: MakeAssistantToolUIOptions<TOutputSchema, TInputSchema>): AssistantToolUIComponent {
  const { toolName, outputSchema, inputSchema, render } = options

  type TInput = TInputSchema extends z.ZodType ? z.infer<TInputSchema> : unknown
  type TData = z.infer<TOutputSchema>

  const Component: React.FC<AssistantToolUIProps> = ({ part }) => {
    const base = {
      toolName: part.toolName,
      toolCallId: part.toolCallId,
      input: (inputSchema
        ? (inputSchema.safeParse(part.input).data ?? part.input)
        : part.input) as TInput
    }

    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
      case 'approval-requested':
      case 'approval-responded':
        return render({
          ...base,
          phase: 'pending',
          status: part.state,
          approval: part.approval
        } as AssistantToolUIState<TInput, TData>)

      case 'output-denied':
        return render({
          ...base,
          phase: 'denied',
          status: 'output-denied',
          reason: part.approval?.reason
        } as AssistantToolUIState<TInput, TData>)

      case 'output-error':
        return render({
          ...base,
          phase: 'error',
          status: 'output-error',
          error: new Error(part.errorText),
          errorText: part.errorText
        } as AssistantToolUIState<TInput, TData>)

      case 'output-available': {
        const parsed = outputSchema.safeParse(normalizeOutput(part.output))
        if (!parsed.success) {
          return render({
            ...base,
            phase: 'error',
            status: 'schema-error',
            error: toError(parsed.error),
            output: part.output
          } as AssistantToolUIState<TInput, TData>)
        }
        try {
          return render({
            ...base,
            phase: 'ready',
            status: 'output-available',
            data: parsed.data as TData,
            output: part.output,
            isPreliminary: part.preliminary ?? false
          })
        } catch (err) {
          return render({
            ...base,
            phase: 'error',
            status: 'render-error',
            error: toError(err),
            output: part.output
          } as AssistantToolUIState<TInput, TData>)
        }
      }

      default:
        return null
    }
  }

  Component.displayName = `AssistantToolUI(${toolName})`

  const WithMeta = Component as AssistantToolUIComponent
  WithMeta.toolName = toolName
  return WithMeta
}
