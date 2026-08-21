export const MOCK_INVITE_TOKEN_PREFIX = 'mock-invite-'
export const MOCK_INVITE_SEND_DELAY_MS = 900

export function buildMockInviteToken(userId: string): string {
  return `${MOCK_INVITE_TOKEN_PREFIX}${userId}`
}

export function isMockInviteToken(token: string): boolean {
  return token.startsWith(MOCK_INVITE_TOKEN_PREFIX)
}

export function buildInviteSetPasswordPath(token: string): string {
  return `/reset-password?token=${encodeURIComponent(token)}`
}

export function buildInviteSetPasswordUrl(origin: string, token: string): string {
  return `${origin}${buildInviteSetPasswordPath(token)}`
}

/**
 * 模拟发送邀请邮件。接入邮件服务后，将此函数替换为真实 API
 *（创建 reset token 并投递 `/reset-password?token=` 链接）。
 */
export async function sendMockUserInviteEmail(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_INVITE_SEND_DELAY_MS)
  })
}
