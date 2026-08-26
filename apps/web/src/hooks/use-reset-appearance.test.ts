import { describe, expect, it, vi } from 'vitest'

import { applyAppearanceReset, isAppearanceDefault } from './use-reset-appearance'

import type { AppearancePreferenceState, AppearanceResetActions } from './use-reset-appearance'

const DEFAULT_STATE: AppearancePreferenceState = {
  theme: 'system',
  defaultTheme: 'system',
  baseColor: 'slate',
  defaultBaseColor: 'slate',
  brandColor: 'slate',
  defaultBrandColor: 'slate',
  font: 'geist',
  defaultFont: 'geist',
  style: 'nova',
  defaultStyle: 'nova',
  variant: 'inset',
  defaultVariant: 'inset',
  collapsible: 'icon',
  defaultCollapsible: 'icon',
  sidebarOpen: true
}

describe('isAppearanceDefault', () => {
  it('returns true when every preference matches the system default', () => {
    expect(isAppearanceDefault(DEFAULT_STATE)).toBe(true)
  })

  it('returns false when theme mode differs from the default', () => {
    expect(isAppearanceDefault({ ...DEFAULT_STATE, theme: 'dark' })).toBe(false)
  })

  it('returns false when the sidebar is collapsed even if cookies match defaults', () => {
    expect(isAppearanceDefault({ ...DEFAULT_STATE, sidebarOpen: false })).toBe(false)
  })

  it('returns false when only the brand color has been customized', () => {
    expect(isAppearanceDefault({ ...DEFAULT_STATE, brandColor: 'blue' })).toBe(false)
  })
})

describe('applyAppearanceReset', () => {
  it('expands the sidebar then resets every appearance preference', () => {
    const actions: AppearanceResetActions = {
      setOpen: vi.fn(),
      resetTheme: vi.fn(),
      resetBaseColor: vi.fn(),
      resetBrandColor: vi.fn(),
      resetFont: vi.fn(),
      resetStyle: vi.fn(),
      resetLayout: vi.fn()
    }

    applyAppearanceReset(actions)

    expect(actions.setOpen).toHaveBeenCalledWith(true)
    expect(actions.resetTheme).toHaveBeenCalledOnce()
    expect(actions.resetBaseColor).toHaveBeenCalledOnce()
    expect(actions.resetBrandColor).toHaveBeenCalledOnce()
    expect(actions.resetFont).toHaveBeenCalledOnce()
    expect(actions.resetStyle).toHaveBeenCalledOnce()
    expect(actions.resetLayout).toHaveBeenCalledOnce()
  })
})
