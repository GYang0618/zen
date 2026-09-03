import { ACCENT_THEME_IDS, DEFAULT_ACCENT_THEME_ID, isAccentThemeId } from '@zen/ui'
import { createContext, useContext, useEffect, useState } from 'react'

import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

import type { AccentThemeId } from '@zen/ui'

/**
 * 与 shadcn/ui create「Theme」accent 预设对齐。
 * - `slate`：系统默认 Theme（经典 slate 蓝灰）
 * - `neutral`：不覆盖，沿用当前 Base Color 的 primary
 * @see https://ui.shadcn.com/create
 */
export const BRAND_COLORS = ACCENT_THEME_IDS
export type BrandColor = AccentThemeId

const DEFAULT_BRAND_COLOR: BrandColor = DEFAULT_ACCENT_THEME_ID
const BRAND_COLOR_COOKIE_NAME = 'vite-ui-brand-color'
const BRAND_COLOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const BRAND_COLOR_ATTR = 'data-brand-color'

/** 旧版品牌色 → 新版 Theme 映射（兼容已写入的 cookie） */
const LEGACY_BRAND_COLOR_MAP: Record<string, BrandColor> = {
  default: 'slate',
  zinc: 'slate'
}

function resolveBrandColor(value: string | undefined, fallback: BrandColor): BrandColor {
  if (isAccentThemeId(value)) return value
  if (value && value in LEGACY_BRAND_COLOR_MAP) return LEGACY_BRAND_COLOR_MAP[value]!
  return fallback
}

/** 纯 DOM 副作用：仅设置属性，配色由 CSS 层处理 */
export function applyBrandColor(color: BrandColor) {
  document.documentElement.setAttribute(BRAND_COLOR_ATTR, color)
}

type BrandColorProviderProps = {
  children: React.ReactNode
  defaultBrandColor?: BrandColor
  storageKey?: string
}

type BrandColorProviderState = {
  defaultBrandColor: BrandColor
  brandColor: BrandColor
  setBrandColor: (color: BrandColor) => void
  resetBrandColor: () => void
}

const initialState: BrandColorProviderState = {
  defaultBrandColor: DEFAULT_BRAND_COLOR,
  brandColor: DEFAULT_BRAND_COLOR,
  setBrandColor: () => undefined,
  resetBrandColor: () => undefined
}

const BrandColorContext = createContext<BrandColorProviderState>(initialState)

export function BrandColorProvider({
  children,
  defaultBrandColor = DEFAULT_BRAND_COLOR,
  storageKey = BRAND_COLOR_COOKIE_NAME
}: BrandColorProviderProps) {
  const [brandColor, setBrandColorState] = useState<BrandColor>(() =>
    resolveBrandColor(getCookie(storageKey), defaultBrandColor)
  )

  useEffect(() => {
    applyBrandColor(brandColor)
  }, [brandColor])

  const setBrandColor = (color: BrandColor) => {
    setCookie(storageKey, color, BRAND_COLOR_COOKIE_MAX_AGE)
    setBrandColorState(color)
  }

  const resetBrandColor = () => {
    removeCookie(storageKey)
    setBrandColorState(defaultBrandColor)
  }

  return (
    <BrandColorContext
      value={{
        defaultBrandColor,
        brandColor,
        setBrandColor,
        resetBrandColor
      }}
    >
      {children}
    </BrandColorContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBrandColor() {
  const context = useContext(BrandColorContext)

  if (!context) {
    throw new Error('useBrandColor must be used within a BrandColorProvider')
  }

  return context
}
