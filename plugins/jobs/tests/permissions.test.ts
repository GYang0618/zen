import { describe, expect, it } from 'vitest'

import { JOB_PERMISSIONS, JOBS_PLUGIN_ID } from '../src/constants'

describe('jobs permissions', () => {
  it('权限码符合 module:resource:action', () => {
    for (const code of Object.values(JOB_PERMISSIONS)) {
      expect(code).toMatch(/^[a-z]+:[a-z]+:[a-z]+$/)
    }
  })

  it('插件 ID 稳定', () => {
    expect(JOBS_PLUGIN_ID).toBe('jobs')
  })
})
