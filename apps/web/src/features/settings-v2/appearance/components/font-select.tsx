import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@zen/ui'

import { useFont } from '@/context/font-provider'

import type { Font } from '@/context/font-provider'
import type { FontOption } from '../types'

/** Font：官方 create 全量预设（Geist 为 radix-nova 默认，置顶） */
const FONT_OPTIONS: FontOption[] = [
  { value: 'geist', label: 'Geist', family: "'Geist Variable', sans-serif" },
  { value: 'inter', label: 'Inter', family: "'Inter Variable', sans-serif" },
  { value: 'noto-sans', label: 'Noto Sans', family: "'Noto Sans Variable', sans-serif" },
  { value: 'nunito-sans', label: 'Nunito Sans', family: "'Nunito Sans Variable', sans-serif" },
  { value: 'figtree', label: 'Figtree', family: "'Figtree Variable', sans-serif" },
  { value: 'roboto', label: 'Roboto', family: "'Roboto Variable', sans-serif" },
  { value: 'raleway', label: 'Raleway', family: "'Raleway Variable', sans-serif" },
  { value: 'dm-sans', label: 'DM Sans', family: "'DM Sans Variable', sans-serif" },
  { value: 'public-sans', label: 'Public Sans', family: "'Public Sans Variable', sans-serif" },
  { value: 'outfit', label: 'Outfit', family: "'Outfit Variable', sans-serif" },
  { value: 'oxanium', label: 'Oxanium', family: "'Oxanium Variable', sans-serif" },
  { value: 'manrope', label: 'Manrope', family: "'Manrope Variable', sans-serif" },
  {
    value: 'space-grotesk',
    label: 'Space Grotesk',
    family: "'Space Grotesk Variable', sans-serif"
  },
  { value: 'montserrat', label: 'Montserrat', family: "'Montserrat Variable', sans-serif" },
  {
    value: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: "'IBM Plex Sans Variable', sans-serif"
  },
  {
    value: 'source-sans-3',
    label: 'Source Sans 3',
    family: "'Source Sans 3 Variable', sans-serif"
  },
  {
    value: 'instrument-sans',
    label: 'Instrument Sans',
    family: "'Instrument Sans Variable', sans-serif"
  },
  {
    value: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono Variable', monospace"
  },
  { value: 'geist-mono', label: 'Geist Mono', family: "'Geist Mono Variable', monospace" },
  { value: 'noto-serif', label: 'Noto Serif', family: "'Noto Serif Variable', serif" },
  { value: 'roboto-slab', label: 'Roboto Slab', family: "'Roboto Slab Variable', serif" },
  {
    value: 'merriweather',
    label: 'Merriweather',
    family: "'Merriweather Variable', serif"
  },
  { value: 'lora', label: 'Lora', family: "'Lora Variable', serif" },
  {
    value: 'playfair-display',
    label: 'Playfair Display',
    family: "'Playfair Display Variable', serif"
  },
  { value: 'eb-garamond', label: 'EB Garamond', family: "'EB Garamond Variable', serif" },
  { value: 'instrument-serif', label: 'Instrument Serif', family: "'Instrument Serif', serif" }
]

export function FontSelect() {
  const { font, setFont } = useFont()
  const selected = FONT_OPTIONS.find((option) => option.value === font)

  return (
    <Select value={font} onValueChange={(value) => setFont(value as Font)}>
      <SelectTrigger className="w-56" style={{ fontFamily: selected?.family }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {FONT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              style={{ fontFamily: option.family }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
