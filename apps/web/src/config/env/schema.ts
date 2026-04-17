import { z } from 'zod'

export const envSchema = z.object({
  VITE_APP_BASE_URL: z.url(),
  VITE_APP_API_TIMEOUT: z.coerce.number().int().positive()
})

export type Env = z.infer<typeof envSchema>
