import { PRESET_PETS, THREAD_PET_PALETTES } from '@/features/pets'

import type { ThreadPetPalette } from '@/features/pets'

export interface ThreadPetAppearance {
  shape: string
  palette: ThreadPetPalette
}

/** 高离散度 32-bit 混合哈希，同一会话种子稳定且分布均匀。 */
export function hashString(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** 同一 threadId 始终落到同一套浅色/暗色调色板。 */
export function resolveThreadPetPalette(threadId: string): ThreadPetPalette {
  const colorIndex = hashString(`${threadId}:color`) % THREAD_PET_PALETTES.length
  return THREAD_PET_PALETTES[colorIndex] ?? THREAD_PET_PALETTES[0]
}

/** 同一 threadId 的形状与颜色，与新建对话欢迎屏宠物一致。 */
export function resolveThreadPetAppearance(threadId: string): ThreadPetAppearance {
  const shapeList = PRESET_PETS.map((pet) => pet.id)
  const shapeIndex = hashString(`${threadId}:shape`) % shapeList.length
  return {
    shape: shapeList[shapeIndex] ?? 'orb',
    palette: resolveThreadPetPalette(threadId)
  }
}
