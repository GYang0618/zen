export interface ParsedThrottleRate {
  enabled: boolean
  limit: number
  ttl: number
}

const UNIT_TO_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000
}

const DISABLED_VALUES = new Set(['off', 'none', '0', 'false', 'disabled'])

/**
 * 将紧凑时间表达（如 "100/m", "10/s", "50/10s", "1000/1h", "off"）解析为 { enabled, limit, ttl }
 */
export function parseThrottleRate(
  raw: string | undefined,
  fallback?: ParsedThrottleRate
): ParsedThrottleRate {
  if (!raw) {
    return fallback ?? { enabled: false, limit: 0, ttl: 0 }
  }

  const trimmed = raw.trim().toLowerCase()
  if (DISABLED_VALUES.has(trimmed)) {
    return { enabled: false, limit: 0, ttl: 0 }
  }

  const match = trimmed.match(/^(\d+)\/(\d*)([smhd])$/)
  if (!match) {
    throw new Error(
      `无效的限流表达式: "${raw}"。格式应如 "100/m", "10/s", "50/10s", "1000/h" 或 "off"`
    )
  }

  const limit = Number.parseInt(match[1], 10)
  const amount = match[2] ? Number.parseInt(match[2], 10) : 1
  const unit = match[3]
  const ttl = amount * (UNIT_TO_MS[unit] ?? 1_000)

  return {
    enabled: limit > 0 && ttl > 0,
    limit,
    ttl
  }
}
