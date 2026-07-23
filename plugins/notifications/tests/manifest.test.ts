import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { zenPluginManifestSchema } from '@zen/plugin-sdk'

describe('notifications manifest', () => {
  it('符合 Manifest 契约', () => {
    const raw = JSON.parse(
      readFileSync(join(__dirname, '../zen.plugin.json'), 'utf8')
    ) as unknown
    const parsed = zenPluginManifestSchema.safeParse(raw)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.id).toBe('notifications')
      expect(parsed.data.contributions.permissions.length).toBe(2)
    }
  })
})
