import { readFileSync } from 'node:fs'

import { zenPluginManifestSchema } from '@zen/plugin-sdk'
import { describe, expect, it } from 'vitest'

describe('notifications manifest', () => {
  it('符合 Manifest 契约', () => {
    const raw = JSON.parse(
      readFileSync(new URL('../zen.plugin.json', import.meta.url), 'utf8')
    ) as unknown
    const parsed = zenPluginManifestSchema.safeParse(raw)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.id).toBe('notifications')
      expect(parsed.data.permissions.length).toBe(2)
    }
  })
})
