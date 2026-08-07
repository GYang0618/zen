import {
  BASE_THEME_IDS,
  DEFAULT_BASE_THEME_ID,
  isBaseThemeId
} from '@zen/ui'
import { createContext, useContext, useEffect, useState } from 'react'

import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

import type { BaseThemeId } from '@zen/ui'

/**
 * 与 shadcn/ui create「Base Color」预设对齐。
 * @see https://ui.shadcn.com/create
 */
export const BASE_COLORS = BASE_THEME_IDS
export type BaseColor = BaseThemeId

const DEFAULT_BASE_COLOR: BaseColor = DEFAULT_BASE_THEME_ID
const BASE_COLOR_COOKIE_NAME = 'vite-ui-base-color'
const BASE_COLOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const BASE_COLOR_ATTR = 'data-base-color'

/** 旧版 Base Color → 新版映射（兼容已写入的 cookie） */
const LEGACY_BASE_COLOR_MAP: Record<string, BaseColor> = {
  default: 'slate'
}

function resolveBaseColor(value: string | undefined, fallback: BaseColor): BaseColor {
  if (isBaseThemeId(value)) return value
  if (value && value in LEGACY_BASE_COLOR_MAP) return LEGACY_BASE_COLOR_MAP[value]!
  return fallback
}

/** 纯 DOM 副作用：仅设置属性，配色由 CSS 层处理 */
export function applyBaseColor(color: BaseColor) {
  document.documentElement.setAttribute(BASE_COLOR_ATTR, color)
}

type BaseColorProviderProps = {
  children: React.ReactNode
  defaultBaseColor?: BaseColor
  storageKey?: string
}

type BaseColorProviderState = {
  defaultBaseColor: BaseColor
  baseColor: BaseColor
  setBaseColor: (color: BaseColor) => void
  resetBaseColor: () => void
}

const initialState: BaseColorProviderState = {
  defaultBaseColor: DEFAULT_BASE_COLOR,
  baseColor: DEFAULT_BASE_COLOR,
  setBaseColor: () => undefined,
  resetBaseColor: () => undefined
}

const BaseColorContext = createContext<BaseColorProviderState>(initialState)

export function BaseColorProvider({
  children,
  defaultBaseColor = DEFAULT_BASE_COLOR,
  storageKey = BASE_COLOR_COOKIE_NAME
}: BaseColorProviderProps) {
  const [baseColor, setBaseColorState] = useState<BaseColor>(() =>
    resolveBaseColor(getCookie(storageKey), defaultBaseColor)
  )

  useEffect(() => {
    applyBaseColor(baseColor)
  }, [baseColor])

  const setBaseColor = (color: BaseColor) => {
    setCookie(storageKey, color, BASE_COLOR_COOKIE_MAX_AGE)
    setBaseColorState(color)
  }

  const resetBaseColor = () => {
    removeCookie(storageKey)
    setBaseColorState(defaultBaseColor)
  }

  return (
    <BaseColorContext
      value={{
        defaultBaseColor,
        baseColor,
        setBaseColor,
        resetBaseColor
      }}
    >
      {children}
    </BaseColorContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBaseColor() {
  const context = useContext(BaseColorContext)

  if (!context) {
    throw new Error('useBaseColor must be used within a BaseColorProvider')
  }

  return context
}
