import type { z } from 'zod'
import type { copilotCallSchema } from './copilot.schema'

export type CopilotCall = z.infer<typeof copilotCallSchema>
