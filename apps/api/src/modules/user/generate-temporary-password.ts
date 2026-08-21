import { randomInt } from 'node:crypto'

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%^&*-?'
const ALL = `${UPPER}${LOWER}${DIGITS}${SYMBOLS}`
const TEMPORARY_PASSWORD_LENGTH = 16

function pick(source: string): string {
  return source[randomInt(source.length)] ?? source[0] ?? 'A'
}

function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    const current = chars[i]
    const swap = chars[j]
    if (current === undefined || swap === undefined) continue
    chars[i] = swap
    chars[j] = current
  }
  return chars
}

/** 生成满足 `userPasswordSchema` 的一次性临时密码，避免易混淆字符。 */
export function generateTemporaryPassword(): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)]
  while (chars.length < TEMPORARY_PASSWORD_LENGTH) {
    chars.push(pick(ALL))
  }
  return shuffle(chars).join('')
}
