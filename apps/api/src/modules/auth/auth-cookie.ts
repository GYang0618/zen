export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'

export type DurationUnit = 's' | 'm' | 'h' | 'd'

export function durationToSeconds(input: string): number {
  const trimmed = input.trim()
  const match = /^([0-9]+)([smhd])$/.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid duration format: ${input}`)
  }

  const value = Number(match[1])
  const unit = match[2] as DurationUnit

  const unitSeconds: Record<DurationUnit, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24
  }

  return value * unitSeconds[unit]
}
