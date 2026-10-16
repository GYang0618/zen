import { userSchema } from '@zen/shared'
import { z } from 'zod'

import type { User } from '@zen/shared'

export const AgentStateSchema = z.object({
  inactive_users: z.array(userSchema).default([]),
  users: z.array(userSchema).default([])
})

export type AgentState = z.infer<typeof AgentStateSchema>
export type { User }
