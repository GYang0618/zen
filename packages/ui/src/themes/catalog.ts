/**
 * 主题目录（与 CSS 文件一一对应，便于拓展时同步改这里）。
 *
 * 新增 Base Color:
 * 1. 添加 `styles/themes/base/{name}.css`
 * 2. 在 `styles/themes/base/index.css` 增加 @import
 * 3. 把 `{name}` 追加到 BASE_THEME_IDS
 *
 * 新增 Accent / Theme:
 * 1. 添加 `styles/themes/accent/{name}.css`
 * 2. 在 `styles/themes/accent/index.css` 增加 @import
 * 3. 把 `{name}` 追加到 ACCENT_THEME_IDS / ACCENT_THEME_CSS_IDS
 *
 * 新增 Style:
 * 1. 添加 `styles/themes/style/{name}.css`
 * 2. 在 `styles/themes/style/index.css` 增加 @import
 * 3. 把 `{name}` 追加到 STYLE_THEME_IDS
 *
 * 新增 Font:
 * 1. 安装对应 `@fontsource-variable/{name}`（或 `@fontsource/{name}`）
 * 2. 在 `styles/themes/font/index.css` 增加 @import 与 `[data-font]` 规则
 * 3. 把 `{name}` 追加到 FONT_THEME_IDS
 *
 * 特例: accent `neutral` 无 CSS 文件，表示不覆盖、沿用当前 Base Color。
 */

/** 系统默认 Base Color → styles/themes/base/slate.css */
export const DEFAULT_BASE_THEME_ID = 'slate' as const

export const BASE_THEME_IDS = [
  'slate',
  'neutral',
  'stone',
  'zinc',
  'mauve',
  'olive',
  'mist',
  'taupe'
] as const

/** 系统默认 Accent / Theme → styles/themes/accent/slate.css */
export const DEFAULT_ACCENT_THEME_ID = 'slate' as const

/** 官方 Neutral Theme：无独立 CSS，沿用当前 Base Color 的 primary */
export const ACCENT_INHERIT_THEME_ID = 'neutral' as const

/** 有独立 CSS 的 Accent（含系统 slate，不含 inherit 的 neutral） */
export const ACCENT_THEME_CSS_IDS = [
  'slate',
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'teal',
  'violet',
  'yellow'
] as const

export const ACCENT_THEME_IDS = [
  'slate',
  'neutral',
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'teal',
  'violet',
  'yellow'
] as const

/**
 * 系统默认 Style → styles/themes/style/nova.css
 * 与 components.json `style: "radix-nova"` 及官方 create Style 对齐
 * 列表顺序：Nova（默认）置顶
 * @see https://ui.shadcn.com/create
 */
export const DEFAULT_STYLE_THEME_ID = 'nova' as const

export const STYLE_THEME_IDS = [
  'nova',
  'vega',
  'maia',
  'lyra',
  'mira',
  'luma',
  'sera',
  'rhea'
] as const

/**
 * 系统默认 Font → Geist（与 radix-nova 官方默认一致）
 * 顺序与官方 create / PRESET_FONTS 对齐
 * @see https://ui.shadcn.com/create
 */
export const DEFAULT_FONT_THEME_ID = 'geist' as const

export const FONT_THEME_IDS = [
  'geist',
  'inter',
  'noto-sans',
  'nunito-sans',
  'figtree',
  'roboto',
  'raleway',
  'dm-sans',
  'public-sans',
  'outfit',
  'oxanium',
  'manrope',
  'space-grotesk',
  'montserrat',
  'ibm-plex-sans',
  'source-sans-3',
  'instrument-sans',
  'jetbrains-mono',
  'geist-mono',
  'noto-serif',
  'roboto-slab',
  'merriweather',
  'lora',
  'playfair-display',
  'eb-garamond',
  'instrument-serif'
] as const

export type BaseThemeId = (typeof BASE_THEME_IDS)[number]
export type AccentThemeId = (typeof ACCENT_THEME_IDS)[number]
export type StyleThemeId = (typeof STYLE_THEME_IDS)[number]
export type FontThemeId = (typeof FONT_THEME_IDS)[number]

export function isBaseThemeId(value: string | undefined): value is BaseThemeId {
  return BASE_THEME_IDS.includes(value as BaseThemeId)
}

export function isAccentThemeId(value: string | undefined): value is AccentThemeId {
  return ACCENT_THEME_IDS.includes(value as AccentThemeId)
}

export function isStyleThemeId(value: string | undefined): value is StyleThemeId {
  return STYLE_THEME_IDS.includes(value as StyleThemeId)
}

export function isFontThemeId(value: string | undefined): value is FontThemeId {
  return FONT_THEME_IDS.includes(value as FontThemeId)
}
