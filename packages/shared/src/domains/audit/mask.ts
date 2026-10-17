const SECRET_KEYS = /pass(word)?|secret|token|otp|code|mfa|apikey|private|authorization/i

/**
 * 递归屏蔽敏感字段（如密码、密钥、令牌等）。
 */
export function maskSecrets(v: unknown, depth = 0): unknown {
  if (depth > 6 || v == null || typeof v !== 'object') {
    return v
  }

  if (Array.isArray(v)) {
    return v.slice(0, 50).map((x) => maskSecrets(x, depth + 1))
  }

  const record = v as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(record)) {
    if (SECRET_KEYS.test(key)) {
      result[key] = '***'
    } else {
      result[key] = maskSecrets(val, depth + 1)
    }
  }

  return result
}

/**
 * 手机号脱敏：保留前 3 位和后 4 位，中间 4 位星号（如 138****1234）。
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (trimmed.length < 7) return '***'
  return trimmed.replace(/^(\d{3})\d+(\d{4})$/, '$1****$2')
}

/**
 * 邮箱脱敏：保留首尾字符，中间星号（如 z***n@example.com）。
 */
export function maskEmail(email?: string | null): string {
  if (!email) return ''
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`
}
