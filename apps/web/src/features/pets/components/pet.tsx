import { cn } from '@zen/ui'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_EYE_PARAMS } from '../constants/emotions'
import { PRESET_PETS } from '../constants/pets-data'
import { usePetRuntime } from '../hooks/use-pet-runtime'
import { PetEyeSystem } from './pet-eye-system'

import type React from 'react'
import type {
  ColorMode,
  EmotionMode,
  GazeMode,
  PetConfig,
  PetDefinition,
  PetEmotion,
  PetEyeParamsMap,
  PetEyeShape
} from '../types'

export interface PetProps {
  /**
   * 宠物形状（体态）：
   * 支持传入预设宠物 ID（默认 'orb' 球团，也可选 'sprout' | 'ghosty' | 'neko' | 'pill' | 'peek' | 'baymax' | 'tvbot' | 'xiaohei' 等），
   * 或直接传入自定义 PetDefinition。
   */
  shape?: string | PetDefinition

  /**
   * 眼睛形状底胚：
   * 'capsule' | 'dot' | 'sparkle' | 'cat' | 'cyber-bar' | 'squircle'
   * 默认：'capsule'（微胶囊眼）
   */
  eyeShape?: PetEyeShape

  /**
   * 当前眼型专属细化参数（可选微调）
   */
  eyeParams?: Partial<PetEyeParamsMap>

  /**
   * 表情状态：
   * 'normal' | 'wink' | 'sad' | 'angry' | 'happy' | 'love' | 'dizzy' | 'eyeroll' | 'sleep'
   * 默认：'normal'（自然）
   */
  emotion?: PetEmotion

  /**
   * 表情模式：
   * 'fixed'（固定表情）| 'random'（定时随机轮转）
   * 默认：'fixed'
   */
  emotionMode?: EmotionMode

  /**
   * 随机表情切换间隔（秒），仅在 emotionMode='random' 时生效
   * 默认：4
   */
  randomEmotionInterval?: number

  /**
   * 视向朝向模式：
   * 'follow'（跟随光标）| 'fixed'（固定朝向）| 'random'（定时随机）
   * 默认：'follow'
   */
  gazeMode?: GazeMode

  /**
   * 固定朝向归一化坐标 [normX, normY]，范围 [-1, 1]
   * 默认：[0, 0]（正视前方）
   */
  fixedGaze?: [number, number]

  /**
   * 随机视向朝向变换间隔（秒）
   * 默认：3
   */
  randomGazeInterval?: number

  /**
   * 色彩模式：
   * 'theme'（跟随品牌色）| 'preset'（预设色板）| 'custom'（自定义拾色）
   * 默认：'theme'
   */
  colorMode?: ColorMode

  /**
   * 自定义身体填充颜色（Hex 或 CSS 颜色表达式），传入即激活或覆盖
   */
  color?: string

  /**
   * 宠物展示大小（正方形边长像素）
   * 默认：180
   */
  size?: number
  width?: number | string
  height?: number | string

  /**
   * 是否启用呼吸/浮动等物理动效
   * 默认：true
   */
  enableAnimation?: boolean

  /**
   * 点击时是否触发 Q 弹果冻缩放回弹
   * 默认：true
   */
  enableSquishOnClick?: boolean

  /**
   * 是否渲染底部柔和环境漫反射投影
   * 默认：自动根据尺寸自适应开启（<=80px 图标尺寸默认隐去）
   */
  showShadow?: boolean

  /**
   * 外部受控果冻弹跳触发信号（数字累加即触发一次弹跳）
   */
  squishSignal?: number

  /**
   * 外部受控眨眼触发信号（数字累加即触发一次眨眼）
   */
  blinkSignal?: number

  /**
   * 容器类名扩展
   */
  className?: string
  /**
   * 容器内联样式扩展
   */
  style?: React.CSSProperties
  /**
   * 点击事件回调
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  /**
   * 键盘事件回调（无障碍键盘触发支持）
   */
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
  /**
   * 无障碍标签
   */
  'aria-label'?: string
}

/**
 * 通用宠物组件：
 * 支持切换不同形状（默认球团）、眼睛（默认微胶囊眼）、表情（默认自然）、视向（默认自由跟随）、颜色（默认跟随系统品牌色）。
 */
export function Pet({
  shape = 'orb',
  eyeShape = 'capsule',
  eyeParams,
  emotion = 'normal',
  emotionMode = 'fixed',
  randomEmotionInterval = 12,
  gazeMode = 'follow',
  fixedGaze = [0, 0],
  randomGazeInterval = 3,
  colorMode = 'theme',
  color,
  size,
  width,
  height,
  enableAnimation = true,
  enableSquishOnClick = true,
  showShadow,
  squishSignal = 0,
  blinkSignal = 0,
  className,
  style,
  onClick,
  onKeyDown,
  'aria-label': ariaLabel
}: PetProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [isSquishing, setIsSquishing] = useState(false)
  const [internalBlink, setInternalBlink] = useState(0)

  // 1. 匹配宠物定义（默认球团 orb）
  const petDefinition: PetDefinition = useMemo(() => {
    if (typeof shape === 'object' && shape !== null) {
      return shape
    }
    const targetId = shape || 'orb'
    return PRESET_PETS.find((p) => p.id === targetId) ?? PRESET_PETS[0]
  }, [shape])

  // 2. 构造响应式配置对象
  const resolvedColor = color
  const resolvedColorMode = resolvedColor ? 'custom' : colorMode

  const config: PetConfig = useMemo(
    () => ({
      colorMode: resolvedColorMode,
      customColor: resolvedColor,
      gazeMode,
      fixedGaze,
      randomGazeInterval,
      eyeShape,
      eyeParams: eyeParams ? { ...DEFAULT_EYE_PARAMS, ...eyeParams } : DEFAULT_EYE_PARAMS,
      emotionMode,
      fixedEmotion: emotion,
      randomEmotionInterval
    }),
    [
      resolvedColorMode,
      resolvedColor,
      gazeMode,
      fixedGaze,
      randomGazeInterval,
      eyeShape,
      eyeParams,
      emotionMode,
      emotion,
      randomEmotionInterval
    ]
  )

  // 3. 驱动宠物微表情与视向运行时
  const runtime = usePetRuntime({
    config,
    svgRef,
    headCenter: petDefinition.headCenter,
    isXiaohei: petDefinition.features?.isXiaohei,
    blinkSignal: blinkSignal + internalBlink
  })

  // 4. 尺寸与阴影自适应
  const resolvedWidth = width ?? size ?? 180
  const resolvedHeight = height ?? size ?? 180
  const isSmallSize =
    typeof resolvedWidth === 'number'
      ? resolvedWidth <= 80
      : Number.parseFloat(String(resolvedWidth)) <= 80
  const shouldShowShadow = showShadow ?? !isSmallSize

  // 5. 外部果冻弹跳信号联动
  const prevSquishRef = useRef(squishSignal)
  useEffect(() => {
    if (squishSignal > 0 && squishSignal !== prevSquishRef.current) {
      setIsSquishing(false)
      requestAnimationFrame(() => {
        setIsSquishing(true)
        setTimeout(() => setIsSquishing(false), 420)
      })
      setInternalBlink((c) => c + 1)
    }
    prevSquishRef.current = squishSignal
  }, [squishSignal])

  // 6. 点击交互逻辑
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (enableSquishOnClick) {
      setIsSquishing(false)
      requestAnimationFrame(() => {
        setIsSquishing(true)
        setTimeout(() => setIsSquishing(false), 420)
      })
    }
    setInternalBlink((c) => c + 1)
    onClick?.(e)
  }

  const animationClass = enableAnimation
    ? petDefinition.animationType === 'float'
      ? 'animate-[petFloat_3.2s_ease-in-out_infinite]'
      : 'animate-[petBreathe_4s_ease-in-out_infinite]'
    : undefined

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? `${petDefinition.name} · ${petDefinition.chineseName}`}
      className={cn(
        'relative flex items-center justify-center select-none outline-hidden cursor-pointer',
        className
      )}
      style={style}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
        onKeyDown?.(e)
      }}
    >
      {/* 全局微动效 CSS Keyframes */}
      <style>{`
        @keyframes petBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.025, 0.985) translateY(-3px); }
        }
        @keyframes petFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes squishBounce {
          0% { transform: scale(1, 1); }
          30% { transform: scale(1.16, 0.82); }
          60% { transform: scale(0.92, 1.10); }
          100% { transform: scale(1, 1); }
        }
        .squish-click {
          animation: squishBounce 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        @keyframes spin-dizzy-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-dizzy-ccw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes pulse-woozy {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
      `}</style>

      {/* 底部微漫反射拟真阴影 */}
      {shouldShowShadow && (
        <div className="pointer-events-none absolute bottom-3 h-3.5 w-32 rounded-full bg-black/20 blur-md dark:bg-black/60" />
      )}

      {/* 宠物主矢量画布 */}
      <svg
        ref={svgRef}
        className={cn(
          'size-full transition-transform duration-200 drop-shadow-md dark:drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]',
          isSquishing && 'squish-click'
        )}
        width={resolvedWidth}
        height={resolvedHeight}
        viewBox={petDefinition.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={
          {
            '--pet-body-color': runtime.bodyColor,
            '--pet-eye-color': runtime.eyeColor,
            '--pet-stroke-color': runtime.bodyColor,
            '--pet-blush-color': runtime.blushColor
          } as React.CSSProperties
        }
      >
        <title>
          {petDefinition.name} · {petDefinition.chineseName}
        </title>
        <g
          className={animationClass}
          style={{
            transformOrigin: `${petDefinition.headCenter.x}px ${petDefinition.headCenter.y}px`
          }}
        >
          {/* 机身形体渲染 */}
          {petDefinition.renderBody({
            bodyFillClass: '[fill:var(--pet-body-color)] transition-[fill] duration-300',
            bodyStrokeClass: '[stroke:var(--pet-body-color)] transition-[stroke] duration-300',
            gaze: {
              gazeX: runtime.gazeX,
              gazeY: runtime.gazeY
            }
          })}

          {/* 眼睛与表情动作系统 */}
          <PetEyeSystem
            runtime={runtime}
            hasBaymaxBridge={petDefinition.features?.hasBaymaxBridge}
          />
        </g>
      </svg>
    </div>
  )
}
