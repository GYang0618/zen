import { useCallback, useLayoutEffect, useState } from 'react'

import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

const NO_LEGACY_KEYS: readonly string[] = []

export type CookiePreferenceOptions<T extends string> = {
  storageKey: string
  defaultValue: T
  maxAge: number
  parse: (raw: string | undefined) => T
  apply?: (value: T) => void
  legacyKeys?: readonly string[]
}

function readPreferenceCookie(
  storageKey: string,
  legacyKeys: readonly string[]
): string | undefined {
  const current = getCookie(storageKey)
  if (current !== undefined) return current

  for (const key of legacyKeys) {
    const value = getCookie(key)
    if (value !== undefined) return value
  }

  return undefined
}

function clearPreferenceCookies(storageKey: string, legacyKeys: readonly string[]): void {
  removeCookie(storageKey)
  for (const key of legacyKeys) {
    removeCookie(key)
  }
}

/**
 * Cookie 偏好：读取并校验、写入、重置；可选同步到 DOM。
 */
export function useCookiePreference<T extends string>({
  storageKey,
  defaultValue,
  maxAge,
  parse,
  apply,
  legacyKeys = NO_LEGACY_KEYS
}: CookiePreferenceOptions<T>) {
  const [value, setValueState] = useState(() => parse(readPreferenceCookie(storageKey, legacyKeys)))

  useLayoutEffect(() => {
    apply?.(value)
  }, [apply, value])

  const setValue = useCallback(
    (next: T) => {
      setCookie(storageKey, next, maxAge)
      for (const key of legacyKeys) {
        removeCookie(key)
      }
      setValueState(next)
    },
    [legacyKeys, maxAge, storageKey]
  )

  const reset = useCallback(() => {
    clearPreferenceCookies(storageKey, legacyKeys)
    setValueState(defaultValue)
  }, [defaultValue, legacyKeys, storageKey])

  return { value, setValue, reset }
}
