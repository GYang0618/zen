import { describe, expect, it } from 'vitest'

import { FILE_PERMISSIONS, FILES_PLUGIN_ID } from '../src/constants'

describe('files permissions', () => {
  it('权限码符合 module:resource:action', () => {
    for (const code of Object.values(FILE_PERMISSIONS)) {
      expect(code).toMatch(/^[a-z]+:[a-z]+:[a-z]+$/)
    }
  })

  it('插件 ID 稳定', () => {
    expect(FILES_PLUGIN_ID).toBe('files')
  })
})
