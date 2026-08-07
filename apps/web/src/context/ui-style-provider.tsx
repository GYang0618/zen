import {
  DEFAULT_STYLE_THEME_ID,
  isStyleThemeId,
  STYLE_THEME_IDS
} from '@zen/ui'
import { createContext, useContext, useEffect, useState } from 'react'

import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

import type { StyleThemeId } from '@zen/ui'

/**
 * 与 shadcn/ui create「Style」预设对齐（主要切换 --radius 造型 token）。
 * 默认 `nova`，与 components.json `radix-nova` 一致。
 * @see https://ui.shadcn.com/create
 */
export const UI_STYLES = STYLE_THEME_IDS
export type UiStyle = StyleThemeId

const DEFAULT_UI_STYLE: UiStyle = DEFAULT_STYLE_THEME_ID
const UI_STYLE_COOKIE_NAME = 'vite-ui-style'
const UI_STYLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const UI_STYLE_ATTR = 'data-style'

/** 纯 DOM 副作用：仅设置属性，造型由 CSS 层处理 */
export function applyUiStyle(style: UiStyle) {
  document.documentElement.setAttribute(UI_STYLE_ATTR, style)
}

type UiStyleProviderProps = {
  children: React.ReactNode
  defaultStyle?: UiStyle
  storageKey?: string
}

type UiStyleProviderState = {
  defaultStyle: UiStyle
  style: UiStyle
  setStyle: (style: UiStyle) => void
  resetStyle: () => void
}

const initialState: UiStyleProviderState = {
  defaultStyle: DEFAULT_UI_STYLE,
  style: DEFAULT_UI_STYLE,
  setStyle: () => undefined,
  resetStyle: () => undefined
}

const UiStyleContext = createContext<UiStyleProviderState>(initialState)

export function UiStyleProvider({
  children,
  defaultStyle = DEFAULT_UI_STYLE,
  storageKey = UI_STYLE_COOKIE_NAME
}: UiStyleProviderProps) {
  const [style, setStyleState] = useState<UiStyle>(() => {
    const saved = getCookie(storageKey)
    return isStyleThemeId(saved) ? saved : defaultStyle
  })

  useEffect(() => {
    applyUiStyle(style)
  }, [style])

  const setStyle = (next: UiStyle) => {
    setCookie(storageKey, next, UI_STYLE_COOKIE_MAX_AGE)
    setStyleState(next)
  }

  const resetStyle = () => {
    removeCookie(storageKey)
    setStyleState(defaultStyle)
  }

  return (
    <UiStyleContext
      value={{
        defaultStyle,
        style,
        setStyle,
        resetStyle
      }}
    >
      {children}
    </UiStyleContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUiStyle() {
  const context = useContext(UiStyleContext)

  if (!context) {
    throw new Error('useUiStyle must be used within a UiStyleProvider')
  }

  return context
}
