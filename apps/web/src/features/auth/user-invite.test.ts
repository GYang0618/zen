import { describe, expect, it } from 'vitest'

import {
  buildInviteSetPasswordPath,
  buildInviteSetPasswordUrl,
  buildMockInviteToken,
  isMockInviteToken
} from './user-invite'

describe('user invite helpers', () => {
  it('builds a mock token that the set-password page can recognize', () => {
    const token = buildMockInviteToken('user-1')
    expect(isMockInviteToken(token)).toBe(true)
    expect(isMockInviteToken('real-reset-token')).toBe(false)
  })

  it('builds the same set-password URL shape future emails will use', () => {
    const token = 'abc+def'
    expect(buildInviteSetPasswordPath(token)).toBe('/reset-password?token=abc%2Bdef')
    expect(buildInviteSetPasswordUrl('https://app.example', token)).toBe(
      'https://app.example/reset-password?token=abc%2Bdef'
    )
  })
})
