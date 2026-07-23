import { z } from 'zod'

export const siteConfigSchema = z.object({
  siteName: z.string().trim().min(1).max(100).default('Zen Admin'),
  logoUrl: z.string().url().nullable().optional(),
  featureFlags: z.record(z.string(), z.boolean()).default({})
})

export type SiteConfig = z.infer<typeof siteConfigSchema>

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'Zen Admin',
  logoUrl: null,
  featureFlags: {}
}
