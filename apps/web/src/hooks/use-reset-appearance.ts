import { useSidebar } from '@zen/ui'
import { useCallback, useMemo } from 'react'

import { useBaseColor } from '@/context/base-color-provider'
import { useBrandColor } from '@/context/brand-color-provider'
import { useFont } from '@/context/font-provider'
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'
import { useUiStyle } from '@/context/ui-style-provider'

export type AppearancePreferenceState = {
  theme: string
  defaultTheme: string
  baseColor: string
  defaultBaseColor: string
  brandColor: string
  defaultBrandColor: string
  font: string
  defaultFont: string
  style: string
  defaultStyle: string
  variant: string
  defaultVariant: string
  collapsible: string
  defaultCollapsible: string
  sidebarOpen: boolean
}

export type AppearanceResetActions = {
  setOpen: (open: boolean) => void
  resetTheme: () => void
  resetBaseColor: () => void
  resetBrandColor: () => void
  resetFont: () => void
  resetStyle: () => void
  resetLayout: () => void
}

/** 主题模式、配色、字体、样式、侧边栏形态与展开布局均已是系统默认。 */
export function isAppearanceDefault(state: AppearancePreferenceState): boolean {
  return (
    state.theme === state.defaultTheme &&
    state.baseColor === state.defaultBaseColor &&
    state.brandColor === state.defaultBrandColor &&
    state.font === state.defaultFont &&
    state.style === state.defaultStyle &&
    state.variant === state.defaultVariant &&
    state.collapsible === state.defaultCollapsible &&
    state.sidebarOpen
  )
}

export function applyAppearanceReset(actions: AppearanceResetActions): void {
  actions.setOpen(true)
  actions.resetTheme()
  actions.resetBaseColor()
  actions.resetBrandColor()
  actions.resetFont()
  actions.resetStyle()
  actions.resetLayout()
}

/**
 * 将全部外观偏好恢复为系统默认（清除对应 cookie，并展开侧边栏）。
 */
export function useResetAppearance() {
  const { open, setOpen } = useSidebar()
  const { theme, defaultTheme, resetTheme } = useTheme()
  const { baseColor, defaultBaseColor, resetBaseColor } = useBaseColor()
  const { brandColor, defaultBrandColor, resetBrandColor } = useBrandColor()
  const { font, defaultFont, resetFont } = useFont()
  const { style, defaultStyle, resetStyle } = useUiStyle()
  const { variant, defaultVariant, collapsible, defaultCollapsible, resetLayout } = useLayout()

  const isDefault = useMemo(
    () =>
      isAppearanceDefault({
        theme,
        defaultTheme,
        baseColor,
        defaultBaseColor,
        brandColor,
        defaultBrandColor,
        font,
        defaultFont,
        style,
        defaultStyle,
        variant,
        defaultVariant,
        collapsible,
        defaultCollapsible,
        sidebarOpen: open
      }),
    [
      baseColor,
      brandColor,
      collapsible,
      defaultBaseColor,
      defaultBrandColor,
      defaultCollapsible,
      defaultFont,
      defaultStyle,
      defaultTheme,
      defaultVariant,
      font,
      open,
      style,
      theme,
      variant
    ]
  )

  const resetAppearance = useCallback(() => {
    applyAppearanceReset({
      setOpen,
      resetTheme,
      resetBaseColor,
      resetBrandColor,
      resetFont,
      resetStyle,
      resetLayout
    })
  }, [resetBaseColor, resetBrandColor, resetFont, resetLayout, resetStyle, resetTheme, setOpen])

  return { isDefault, resetAppearance }
}
