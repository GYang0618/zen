import { describe, expect, it } from 'vitest'

import { DEMO_NOTE_PERMISSIONS, DEMO_NOTES_PLUGIN_ID } from '../src/constants'

describe('demo-notes permissions', () => {
  it('权限码符合 module:resource:action', () => {
    for (const code of Object.values(DEMO_NOTE_PERMISSIONS)) {
      expect(code).toMatch(/^[a-z]+:[a-z]+:[a-z]+$/)
    }
  })

  it('插件 ID 稳定', () => {
    expect(DEMO_NOTES_PLUGIN_ID).toBe('demo-notes')
  })
})
