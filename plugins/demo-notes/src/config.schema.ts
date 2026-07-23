import { z } from 'zod'

export const demoNotesConfigSchema = z.object({
  maxNotesPerUser: z.number().int().positive().default(100)
})

export type DemoNotesConfig = z.infer<typeof demoNotesConfigSchema>

export const DEFAULT_DEMO_NOTES_CONFIG: DemoNotesConfig = {
  maxNotesPerUser: 100
}
