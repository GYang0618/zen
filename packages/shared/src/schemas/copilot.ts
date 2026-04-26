import { z } from 'zod'

import type { UIMessage } from 'ai'

export const copilotCallSchema = z.object({
  messages: z.custom<UIMessage[]>()
})
