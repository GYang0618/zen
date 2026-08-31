import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'
import { z } from 'zod'

export const ContextSchema = z.object({
  [ACCESS_TOKEN_CONFIGURABLE_KEY]: z.string().optional()
})
