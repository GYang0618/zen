import { DEFAULT_EYE_PARAMS } from './emotions'

import type { PetConfig } from '../types'

export interface ColorPreset {
  id: string
  label: string
  hex: string
}

export const PRESET_PET_COLORS: readonly ColorPreset[] = [
  { id: 'mint', label: '薄荷绿', hex: '#34D399' },
  { id: 'sakura', label: '樱花粉', hex: '#F472B6' },
  { id: 'butter', label: '黄油暖黄', hex: '#FCD34D' },
  { id: 'sky', label: '天蓝色', hex: '#38BDF8' },
  { id: 'lavender', label: '薰衣草紫', hex: '#A78BFA' },
  { id: 'emerald', label: '翡翠绿', hex: '#10B981' },
  { id: 'orange', label: '暖阳橙', hex: '#FB923C' },
  { id: 'rose', label: '玫瑰红', hex: '#FB7185' }
] as const

/** 默认每只宠物的初始出厂配置（默认胶囊眼微胶囊形态 + 自然默认表情） */
export const DEFAULT_PET_CONFIG: PetConfig = {
  colorMode: 'theme',
  customColor: '#34D399',
  gazeMode: 'follow',
  fixedGaze: [0, 0],
  randomGazeInterval: 3,
  eyeShape: 'capsule',
  eyeParams: DEFAULT_EYE_PARAMS,
  emotionMode: 'fixed',
  fixedEmotion: 'normal',
  randomEmotionInterval: 12
}

export interface ThreadPetPalette {
  id: string
  name: string
  light: string
  dark: string
}

/** 对话线程随机宠物专属调色板：纯彩色系（无黑白灰或系统跟随），区分浅色/暗色模式以保证视觉饱和度与对比度 */
export const THREAD_PET_PALETTES: readonly ThreadPetPalette[] = [
  // 红色 / 洋红 / 珊瑚
  { id: 'scarlet', name: '热情朱红', light: '#DC2626', dark: '#F87171' },
  { id: 'ruby', name: '宝石深红', light: '#BE123C', dark: '#FB7185' },
  { id: 'coral-red', name: '暖珊瑚红', light: '#E11D48', dark: '#FDA4AF' },
  { id: 'fuchsia', name: '璀璨洋红', light: '#C026D3', dark: '#E879F9' },

  // 橙色 / 杏色 / 柿红
  { id: 'tangerine', name: '活力蜜橙', light: '#EA580C', dark: '#FB923C' },
  { id: 'sunshine-orange', name: '暖阳亮橙', light: '#F97316', dark: '#FDBA74' },
  { id: 'persimmon', name: '柿子暖红', light: '#C2410C', dark: '#FB923C' },
  { id: 'apricot', name: '甜杏粉橙', light: '#EA580C', dark: '#FED7AA' },

  // 黄色 / 暖金 / 柠檬
  { id: 'honey-gold', name: '暖金蜜黄', light: '#D97706', dark: '#FBBF24' },
  { id: 'lemon', name: '鲜亮柠檬', light: '#CA8A04', dark: '#FDE047' },
  { id: 'sunflower', name: '向日葵金', light: '#B45309', dark: '#FACC15' },
  { id: 'amber', name: '温润琥珀', light: '#D97706', dark: '#FCD34D' },

  // 黄绿 / 青柠
  { id: 'lime', name: '青翠青柠', light: '#65A30D', dark: '#A3E635' },
  { id: 'neon-lime', name: '电光嫩绿', light: '#4D7C0F', dark: '#84CC16' },
  { id: 'chartreuse', name: '芥末青黄', light: '#84CC16', dark: '#BEF264' },

  // 绿色 / 薄荷 / 祖母绿
  { id: 'mint', name: '薄荷翠绿', light: '#059669', dark: '#34D399' },
  { id: 'spring-green', name: '春意嫩绿', light: '#16A34A', dark: '#4ADE80' },
  { id: 'emerald', name: '浓翠祖母绿', light: '#047857', dark: '#10B981' },
  { id: 'ice-mint', name: '冰霜清荷', light: '#0D9488', dark: '#5EEAD4' },

  // 青绿 / 松石绿 / 青蓝
  { id: 'teal', name: '碧波松石', light: '#0F766E', dark: '#2DD4BF' },
  { id: 'cyan', name: '明澈青蓝', light: '#0891B2', dark: '#22D3EE' },
  { id: 'aqua', name: '海盐水青', light: '#0284C7', dark: '#38BDF8' },
  { id: 'peacock', name: '孔雀琉璃', light: '#0369A1', dark: '#67E8F9' },

  // 蓝色 / 宝蓝 / 天青
  { id: 'sky', name: '澄澈天蓝', light: '#2563EB', dark: '#60A5FA' },
  { id: 'ocean-blue', name: '浩瀚深蓝', light: '#1D4ED8', dark: '#93C5FD' },
  { id: 'indigo', name: '电光青金', light: '#4F46E5', dark: '#818CF8' },
  { id: 'cobalt', name: '皇家钴蓝', light: '#4338CA', dark: '#A5B4FC' },

  // 紫色 / 薰衣草 / 浆果
  { id: 'lavender', name: '梦幻薰衣紫', light: '#7C3AED', dark: '#A78BFA' },
  { id: 'grape', name: '浓郁葡萄紫', light: '#9333EA', dark: '#C084FC' },
  { id: 'crystal-violet', name: '水晶紫罗兰', light: '#6D28D9', dark: '#C4B5FD' },

  // 粉色 / 樱花 / 莓果
  { id: 'sakura', name: '娇嫩樱粉', light: '#DB2777', dark: '#F472B6' },
  { id: 'neon-pink', name: '荧光芭比粉', light: '#E11D48', dark: '#FB7185' }
] as const

/** 智能判断颜色明度（用于眼睛与身体的高对比度自动切换） */
export function isColorLight(colorStr: string): boolean {
  const c = colorStr.trim().toLowerCase()
  if (c.startsWith('#')) {
    const raw = c.slice(1)
    const hex =
      raw.length === 3
        ? raw
            .split('')
            .map((x) => x + x)
            .join('')
        : raw
    const num = Number.parseInt(hex, 16)
    if (!Number.isNaN(num) && hex.length === 6) {
      const r = (num >> 16) & 255
      const g = (num >> 8) & 255
      const b = num & 255
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      return lum > 145
    }
  }
  return (
    c === '#ffffff' ||
    c === '#fff' ||
    c.startsWith('rgb(255') ||
    ['#34d399', '#f472b6', '#fcd34d', '#38bdf8', '#a78bfa', '#fb923c', '#fda4af'].includes(c)
  )
}
