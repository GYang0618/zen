import {
  DEFAULT_FONT_THEME_ID,
  FONT_THEME_IDS,
  isFontThemeId
} from '@zen/ui'
import { createContext, useContext, useEffect, useState } from 'react'

import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

import type { FontThemeId } from '@zen/ui'

/**
 * 与 shadcn/ui create「Font」预设对齐。
 * 默认 `geist`，与 components.json `radix-nova` 一致。
 * @see https://ui.shadcn.com/create
 */
export const FONTS = FONT_THEME_IDS
export type Font = FontThemeId

const DEFAULT_FONT: Font = DEFAULT_FONT_THEME_ID
const FONT_COOKIE_NAME = 'vite-ui-font'
const LEGACY_FONT_COOKIE_NAME = 'font'
const FONT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const FONT_ATTR = 'data-font'

/** 旧版字体 cookie → 官方 Font ID */
const LEGACY_FONT_MAP: Record<string, Font> = {
  system: 'geist',
  inter: 'inter',
  manrope: 'manrope'
}

function resolveFont(value: string | undefined, fallback: Font): Font {
  if (isFontThemeId(value)) return value
  if (value && value in LEGACY_FONT_MAP) return LEGACY_FONT_MAP[value]!
  return fallback
}

/** 纯 DOM 副作用：仅设置属性，字体由 CSS 层处理 */
export function applyFont(font: Font) {
  document.documentElement.setAttribute(FONT_ATTR, font)
}

type FontProviderProps = {
  children: React.ReactNode
  defaultFont?: Font
  storageKey?: string
}

type FontProviderState = {
  defaultFont: Font
  font: Font
  setFont: (font: Font) => void
  resetFont: () => void
}

const initialState: FontProviderState = {
  defaultFont: DEFAULT_FONT,
  font: DEFAULT_FONT,
  setFont: () => undefined,
  resetFont: () => undefined
}

const FontContext = createContext<FontProviderState>(initialState)

export function FontProvider({
  children,
  defaultFont = DEFAULT_FONT,
  storageKey = FONT_COOKIE_NAME
}: FontProviderProps) {
  const [font, setFontState] = useState<Font>(() => {
    const saved = getCookie(storageKey) ?? getCookie(LEGACY_FONT_COOKIE_NAME)
    return resolveFont(saved, defaultFont)
  })

  useEffect(() => {
    applyFont(font)
  }, [font])

  const setFont = (next: Font) => {
    setCookie(storageKey, next, FONT_COOKIE_MAX_AGE)
    removeCookie(LEGACY_FONT_COOKIE_NAME)
    setFontState(next)
  }

  const resetFont = () => {
    removeCookie(storageKey)
    removeCookie(LEGACY_FONT_COOKIE_NAME)
    setFontState(defaultFont)
  }

  return (
    <FontContext
      value={{
        defaultFont,
        font,
        setFont,
        resetFont
      }}
    >
      {children}
    </FontContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFont() {
  const context = useContext(FontContext)

  if (!context) {
    throw new Error('useFont must be used within a FontProvider')
  }

  return context
}
