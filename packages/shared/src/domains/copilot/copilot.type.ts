import type { z } from 'zod'
import type { copilotCallSchema } from './copilot.schema'

export type CopilotCall = z.infer<typeof copilotCallSchema>

/** 与 {@link CopilotCall} 相同，供 Chat 命名空间使用 */
export type ChatCall = CopilotCall
