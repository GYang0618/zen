import { z } from 'zod'

import type { UIMessage } from 'ai'

export const callSchema = z.object({
  messages: z.custom<UIMessage[]>()
})

export type CallDto = z.infer<typeof callSchema>
