import { createContext, useCallback, useContext, useMemo } from 'react'

import { useCookiePreference } from '@/hooks/use-cookie-preference'

export const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const LAYOUT_COLLAPSIBLE_COOKIE_NAME = 'layout_collapsible'
export const LAYOUT_VARIANT_COOKIE_NAME = 'layout_variant'

export const LAYOUT_VARIANT_IDS = ['inset', 'sidebar', 'floating'] as const
export const COLLAPSIBLE_IDS = ['offcanvas', 'icon', 'none'] as const

export type LayoutVariant = (typeof LAYOUT_VARIANT_IDS)[number]
export type Collapsible = (typeof COLLAPSIBLE_IDS)[number]

const DEFAULT_VARIANT: LayoutVariant = 'inset'
const DEFAULT_COLLAPSIBLE: Collapsible = 'icon'

export function isLayoutVariant(value: string | undefined): value is LayoutVariant {
  return LAYOUT_VARIANT_IDS.includes(value as LayoutVariant)
}

export function isCollapsible(value: string | undefined): value is Collapsible {
  return COLLAPSIBLE_IDS.includes(value as Collapsible)
}

type LayoutContextType = {
  resetLayout: () => void

  defaultCollapsible: Collapsible
  collapsible: Collapsible
  setCollapsible: (collapsible: Collapsible) => void

  defaultVariant: LayoutVariant
  variant: LayoutVariant
  setVariant: (variant: LayoutVariant) => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

type LayoutProviderProps = {
  children: React.ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const {
    value: collapsible,
    setValue: setCollapsible,
    reset: resetCollapsible
  } = useCookiePreference<Collapsible>({
    storageKey: LAYOUT_COLLAPSIBLE_COOKIE_NAME,
    defaultValue: DEFAULT_COLLAPSIBLE,
    maxAge: LAYOUT_COOKIE_MAX_AGE,
    parse: (raw) => (isCollapsible(raw) ? raw : DEFAULT_COLLAPSIBLE)
  })

  const {
    value: variant,
    setValue: setVariant,
    reset: resetVariant
  } = useCookiePreference<LayoutVariant>({
    storageKey: LAYOUT_VARIANT_COOKIE_NAME,
    defaultValue: DEFAULT_VARIANT,
    maxAge: LAYOUT_COOKIE_MAX_AGE,
    parse: (raw) => (isLayoutVariant(raw) ? raw : DEFAULT_VARIANT)
  })

  const resetLayout = useCallback(() => {
    resetCollapsible()
    resetVariant()
  }, [resetCollapsible, resetVariant])

  const contextValue = useMemo(
    () => ({
      resetLayout,
      defaultCollapsible: DEFAULT_COLLAPSIBLE,
      collapsible,
      setCollapsible,
      defaultVariant: DEFAULT_VARIANT,
      variant,
      setVariant
    }),
    [collapsible, resetLayout, setCollapsible, setVariant, variant]
  )

  return <LayoutContext value={contextValue}>{children}</LayoutContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}
