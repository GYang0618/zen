import { describe, expect, it } from 'vitest'

import { NOTIF_PERMISSIONS, NOTIFICATIONS_PLUGIN_ID } from '../src/constants'

describe('notifications permissions', () => {
  it('权限码符合 module:resource:action', () => {
    for (const code of Object.values(NOTIF_PERMISSIONS)) {
      expect(code).toMatch(/^[a-z]+:[a-z]+:[a-z]+$/)
    }
  })

  it('插件 ID 稳定', () => {
    expect(NOTIFICATIONS_PLUGIN_ID).toBe('notifications')
  })
})
