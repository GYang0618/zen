import type { UIMessage } from 'ai'
import { z } from 'zod'

export const callSchema = z.object({
  messages: z.custom<UIMessage[]>()
})

export type CallDto = z.infer<typeof callSchema>
