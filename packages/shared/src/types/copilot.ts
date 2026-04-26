import type { z } from 'zod'
import type { copilotCallSchema } from '../schemas/copilot'

export type CopilotCall = z.infer<typeof copilotCallSchema>
