import type { PetEmotion, PetEyeParamsMap, PetEyeShape } from '../types'

/** 眼间距常量（依据原型规范：普通与欢快紧凑 42px，八字委屈与安睡舒展 48px） */
export const SPACING_COMPACT = 42.0
export const SPACING_WIDE = 48.0

/** 各眼型默认专有细化参数（微胶囊 15×19 为基准） */
export const DEFAULT_EYE_PARAMS: PetEyeParamsMap = {
  capsule: {
    width: 15.0,
    height: 19.0,
    rxFactor: 0.5
  },
  dot: {
    radius: 7.5
  },
  sparkle: {
    width: 17.0,
    height: 22.0,
    hlScale: 1.0
  },
  cat: {
    width: 9.5,
    height: 14.0,
    sharpness: 0.3
  },
  'cyber-bar': {
    width: 22.0,
    height: 8.5,
    radius: 4.25
  },
  squircle: {
    size: 15.0,
    radius: 3.5
  }
}

/** 胶囊眼预设模板：微胶囊 vs 长胶囊 */
export const CAPSULE_PRESETS = {
  subtle: { width: 15.0, height: 19.0, rxFactor: 0.5 },
  tall: { width: 14.5, height: 36.0, rxFactor: 0.5 }
} as const

export interface EyeShapeMeta {
  id: PetEyeShape
  label: string
  shortLabel: string
  emoji: string
  description: string
}

/** 6 种眼睛形状元数据目录 */
export const EYE_SHAPES_CATALOG: readonly EyeShapeMeta[] = [
  {
    id: 'capsule',
    label: '胶囊眼 (微胶囊默认)',
    shortLabel: '微胶囊眼',
    emoji: '💊',
    description: '经典微胶囊宽高比 (15×19)，亦可切换为修长长胶囊'
  },
  {
    id: 'dot',
    label: '正圆豆豆眼',
    shortLabel: '豆豆眼',
    emoji: '⚫',
    description: '极简圆润正圆，单一直径纯粹掌控'
  },
  {
    id: 'sparkle',
    label: '高光双瞳眼',
    shortLabel: '高光双瞳',
    emoji: '✨',
    description: '漫画级拟真双高光反射斑，灵气生动'
  },
  {
    id: 'cat',
    label: '猫咪梭形眼',
    shortLabel: '猫咪梭形',
    emoji: '🐱',
    description: '优雅猫眼梭形轮廓，弧度尖锐微收'
  },
  {
    id: 'cyber-bar',
    label: '数码横条眼',
    shortLabel: '数码横条',
    emoji: '➖',
    description: '复古未来主义机甲感，圆角横长条晶体'
  },
  {
    id: 'squircle',
    label: '像素方圆眼',
    shortLabel: '像素方圆',
    emoji: '⏹️',
    description: '等边极简超椭圆，工业像素方圆几何美感'
  }
]

export interface EmotionMeta {
  id: PetEmotion
  label: string
  emoji: string
  description: string
  hasBlush?: boolean
}

/** 9 种纯表情动作元数据目录（标准化专业命名） */
export const EMOTIONS_CATALOG: readonly EmotionMeta[] = [
  {
    id: 'normal',
    label: '自然',
    emoji: '👀',
    description: '自然待机视线，保持所选眼型轮廓'
  },
  {
    id: 'wink',
    label: '眨眼',
    emoji: '😉',
    description: '单眼微弧眨眼，灵动俏皮'
  },
  {
    id: 'sad',
    label: '委屈',
    emoji: '🥺',
    description: '眼距舒展微外倾，楚楚动人'
  },
  {
    id: 'angry',
    label: '生气',
    emoji: '💢',
    description: '双眼向内微倾，严肃专注'
  },
  {
    id: 'happy',
    label: '微笑',
    emoji: '😊',
    description: '弯弯眯眼微笑，伴随柔和腮红浮现',
    hasBlush: true
  },
  {
    id: 'love',
    label: '喜爱',
    emoji: '❤️',
    description: '晶莹爱心眼与元气腮红',
    hasBlush: true
  },
  {
    id: 'dizzy',
    label: '眩晕',
    emoji: '🌀',
    description: '向心双向螺旋蚊香，晕乎旋转'
  },
  {
    id: 'eyeroll',
    label: '无奈',
    emoji: '🙄',
    description: '浅色眼眶与向上视线，傲娇无奈'
  },
  {
    id: 'sleep',
    label: '休眠',
    emoji: '💤',
    description: '安详平线闭目休息'
  }
]

/** 获取特定情绪的目标眼距 */
export function getTargetEyeSpacing(emotion: PetEmotion): number {
  return emotion === 'sad' || emotion === 'sleep' ? SPACING_WIDE : SPACING_COMPACT
}

/**
 * 拟真随机轮换中可穿插的生动非自然微表情池（排除基线 normal 与贴边 sleep）
 */
export const BIOMIMETIC_EXPRESSIVE_EMOTIONS: readonly PetEmotion[] = [
  'wink',
  'happy',
  'love',
  'dizzy',
  'eyeroll',
  'sad'
]

/**
 * 拟真自然表情（基线状态）停留时长：5s ~ 10s 动态随机
 */
export function getBiomimeticNormalDuration(): number {
  return 5000 + Math.random() * 5000
}

/**
 * 拟真非自然表情（微表情阶段）停留时长：2s ~ 5s 动态随机
 * 针对各动作的生理认知与动效节奏微调：
 * - 眨眼 (wink)：1.8s ~ 2.8s，轻快灵巧，避免长时间单目闭合
 * - 眩晕 (dizzy) / 无奈 (eyeroll)：2.2s ~ 3.6s，诙谐适中
 * - 微笑 (happy) / 喜爱 (love) / 委屈 (sad)：2.5s ~ 4.5s，饱满温存
 */
export function getBiomimeticExpressiveDuration(emotion: PetEmotion): number {
  if (emotion === 'wink') {
    return 1800 + Math.random() * 1000
  }
  if (emotion === 'dizzy' || emotion === 'eyeroll') {
    return 2200 + Math.random() * 1400
  }
  // 微笑 (happy) / 喜爱 (love) / 委屈 (sad) 等饱满情绪：2.5s ~ 4.5s
  return 2500 + Math.random() * 2000
}

/**
 * 从生动表情池中随机挑选不同于当前的表情
 */
export function pickRandomExpressiveEmotion(current?: PetEmotion): PetEmotion {
  const filtered = BIOMIMETIC_EXPRESSIVE_EMOTIONS.filter((e) => e !== current)
  const pool = filtered.length > 0 ? filtered : BIOMIMETIC_EXPRESSIVE_EMOTIONS
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx] ?? 'happy'
}
