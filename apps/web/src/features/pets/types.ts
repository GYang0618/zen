import type React from 'react'

/** 宠物体态动画类型 */
export type PetAnimationType = 'breathe' | 'float'

/** 宠物专属联动特征 */
export interface PetFeatures {
  /** 是否拥有超能陆战队大白双眼贯通线 */
  hasBaymaxBridge?: boolean
  /** 是否拥有嘟嘟小猪随视线联动的大猪鼻 */
  hasPiggySnout?: boolean
  /** 是否拥有水豚噜噜随视线联动的小鼻吻 */
  hasCapybaraSnout?: boolean
  /** 是否拥有罗小黑嘿咻超大号灵动巨眼比例及自适应倍率 */
  isXiaohei?: boolean
}

/** 机身渲染上下文参数 */
export interface PetBodyRenderProps {
  /** 机身填充色 CSS 类名或 style 注入 */
  bodyFillClass?: string
  /** 机身描边色 CSS 类名或 style 注入 */
  bodyStrokeClass?: string
  /** 当前视向偏移 */
  gaze: {
    gazeX: number
    gazeY: number
  }
}

/** 宠物元数据定义（纯静态声明式抽离） */
export interface PetDefinition {
  id: string
  number: string
  tag: string
  name: string
  chineseName: string
  description: string
  viewBox: string
  headCenter: {
    x: number
    y: number
  }
  animationType: PetAnimationType
  features?: PetFeatures
  renderBody: (props: PetBodyRenderProps) => React.ReactNode
  /** 默认 SVG 源码静态片段（用于复制） */
  rawSvg: string
}

/** 6 种眼睛基础形状底胚 */
export const PET_EYE_SHAPES = ['capsule', 'dot', 'sparkle', 'cat', 'cyber-bar', 'squircle'] as const

export type PetEyeShape = (typeof PET_EYE_SHAPES)[number]

/** 胶囊眼细化参数 (19.0 为微胶囊，36.0 为长胶囊) */
export interface CapsuleEyeParams {
  width: number
  height: number
  rxFactor: number
}

/** 豆豆眼细化参数 (单一正圆半径) */
export interface DotEyeParams {
  radius: number
}

/** 高光双瞳眼细化参数 */
export interface SparkleEyeParams {
  width: number
  height: number
  hlScale: number
}

/** 猫咪梭形眼细化参数 */
export interface CatEyeParams {
  width: number
  height: number
  sharpness: number
}

/** 数码横条眼细化参数 */
export interface CyberBarEyeParams {
  width: number
  height: number
  radius: number
}

/** 像素方圆眼细化参数 */
export interface SquircleEyeParams {
  size: number
  radius: number
}

/** 所有眼型的专有细化参数字典 */
export interface PetEyeParamsMap {
  capsule: CapsuleEyeParams
  dot: DotEyeParams
  sparkle: SparkleEyeParams
  cat: CatEyeParams
  'cyber-bar': CyberBarEyeParams
  squircle: SquircleEyeParams
}

/** 9 种表情动作状态 */
export const PET_EMOTIONS = [
  'normal',
  'wink',
  'sad',
  'angry',
  'happy',
  'love',
  'dizzy',
  'eyeroll',
  'sleep'
] as const

export type PetEmotion = (typeof PET_EMOTIONS)[number]

/** 视向朝向模式 */
export type GazeMode = 'follow' | 'fixed' | 'random'

/** 表情轮换模式 */
export type EmotionMode = 'fixed' | 'random'

/** 色彩模式 */
export type ColorMode = 'theme' | 'preset' | 'custom'

/** 单只宠物的个性化运行时配置 */
export interface PetConfig {
  /** 色彩模式：跟随系统品牌色 / 预设色板 / 自定义取色 */
  colorMode: ColorMode
  /** 自定义 Hex 色值（当 colorMode 为 preset 或 custom 时生效） */
  customColor?: string
  /** 视向朝向模式：跟随鼠标 / 固定朝向 / 定时随机 */
  gazeMode: GazeMode
  /** 固定朝向归一化坐标 [normX, normY]，范围 [-1, 1] */
  fixedGaze?: [number, number]
  /** 随机朝向变换间隔（秒） */
  randomGazeInterval?: number
  /** 当前眼睛形状 */
  eyeShape: PetEyeShape
  /** 当前眼型专属细化参数配置表 */
  eyeParams?: Partial<PetEyeParamsMap>
  /** 表情与动作模式：固定表情 / 定时随机 */
  emotionMode: EmotionMode
  /** 固定表情状态 */
  fixedEmotion?: PetEmotion
  /** 随机表情变换间隔（秒） */
  randomEmotionInterval?: number
}
