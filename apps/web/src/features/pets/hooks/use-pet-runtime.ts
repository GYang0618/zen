import { useCallback, useEffect, useRef, useState } from 'react'

import { isColorLight } from '../constants/colors'
import {
  DEFAULT_EYE_PARAMS,
  getBiomimeticExpressiveDuration,
  getBiomimeticNormalDuration,
  getTargetEyeSpacing,
  pickRandomExpressiveEmotion
} from '../constants/emotions'

import type { PetConfig, PetEmotion, PetEyeParamsMap, PetEyeShape } from '../types'

interface UsePetRuntimeOptions {
  config: PetConfig
  svgRef: React.RefObject<SVGSVGElement | null>
  headCenter: { x: number; y: number }
  isXiaohei?: boolean
  blinkSignal?: number
}

export interface PetRuntimeState {
  currentEyeShape: PetEyeShape
  currentEyeParams: PetEyeParamsMap
  currentEmotion: PetEmotion
  normX: number
  normY: number
  gazeX: number
  gazeY: number
  dynamicTilt: number
  depthScaleL: number
  depthScaleR: number
  widthShrinkL: number
  widthShrinkR: number
  halfSpacing: number
  blinkScaleY: number
  eyeLx: number
  eyeLy: number
  eyeRx: number
  eyeRy: number
  bodyColor: string
  eyeColor: string
  blushColor: string
}

export function usePetRuntime({
  config,
  svgRef,
  headCenter,
  isXiaohei = false,
  blinkSignal = 0
}: UsePetRuntimeOptions): PetRuntimeState {
  const configRef = useRef(config)
  configRef.current = config

  const [runtimeEmotion, setRuntimeEmotion] = useState<PetEmotion>(
    config.emotionMode === 'fixed' ? (config.fixedEmotion ?? 'normal') : 'normal'
  )

  // 视向平滑插值变量
  const currentGazeRef = useRef<[number, number]>([0, 0])
  const targetGazeRef = useRef<[number, number]>([0, 0])

  // 眼间距平滑插值变量
  const spacingRef = useRef<number>(getTargetEyeSpacing(runtimeEmotion))

  // 眨眼状态
  const [blinkScaleY, setBlinkScaleY] = useState(1.0)
  const isBlinkingRef = useRef(false)
  const nextBlinkTimeRef = useRef(Date.now() + 2500)

  // 当前帧输出状态
  const [renderState, setRenderState] = useState<PetRuntimeState>(() => {
    const shape = config.eyeShape ?? 'capsule'
    const params: PetEyeParamsMap = {
      ...DEFAULT_EYE_PARAMS,
      ...(config.eyeParams ?? {})
    }
    return {
      currentEyeShape: shape,
      currentEyeParams: params,
      currentEmotion: runtimeEmotion,
      normX: 0,
      normY: 0,
      gazeX: 0,
      gazeY: 0,
      dynamicTilt: 0,
      depthScaleL: 1.0,
      depthScaleR: 1.0,
      widthShrinkL: 1.0,
      widthShrinkR: 1.0,
      halfSpacing: 21.0,
      blinkScaleY: 1.0,
      eyeLx: headCenter.x - 21.0,
      eyeLy: headCenter.y,
      eyeRx: headCenter.x + 21.0,
      eyeRy: headCenter.y,
      bodyColor: 'var(--primary)',
      eyeColor: '#111215',
      blushColor: '#FDA4AF'
    }
  })

  // 1. 处理表情模式变化与拟真随机轮播
  useEffect(() => {
    if (config.emotionMode === 'fixed') {
      setRuntimeEmotion(config.fixedEmotion ?? 'normal')
      return
    }

    // 拟真随机表情循环：以自然表情为主导 (5-10s)，随机穿插生动非自然微表情 (2-5s)
    let timer: ReturnType<typeof setTimeout>
    let isNormalPhase = false
    let lastExpressive: PetEmotion = 'happy'

    const scheduleNext = () => {
      if (isNormalPhase) {
        setRuntimeEmotion('normal')
        isNormalPhase = false
        const delayMs = getBiomimeticNormalDuration()
        timer = setTimeout(scheduleNext, delayMs)
      } else {
        const nextEmo = pickRandomExpressiveEmotion(lastExpressive)
        lastExpressive = nextEmo
        setRuntimeEmotion(nextEmo)
        isNormalPhase = true
        const delayMs = getBiomimeticExpressiveDuration(nextEmo)
        timer = setTimeout(scheduleNext, delayMs)
      }
    }

    // 初始以自然状态为基线启动 5-10s
    const initialDelay = getBiomimeticNormalDuration()
    timer = setTimeout(scheduleNext, initialDelay)

    return () => clearTimeout(timer)
  }, [config.emotionMode, config.fixedEmotion])

  // 2. 处理视向模式与目标方位设定
  useEffect(() => {
    if (config.gazeMode === 'fixed') {
      targetGazeRef.current = config.fixedGaze ?? [0, 0]
      return
    }

    if (config.gazeMode === 'random') {
      const intervalMs = Math.max(1, config.randomGazeInterval ?? 3) * 1000
      const pickRandomGaze = () => {
        // 随机产生自然角度，偏水平张望
        const rx = (Math.random() * 2 - 1) * 0.95
        const ry = (Math.random() * 2 - 1) * 0.6
        targetGazeRef.current = [rx, ry]
      }
      pickRandomGaze()
      const timer = setInterval(pickRandomGaze, intervalMs)
      return () => clearInterval(timer)
    }

    if (config.gazeMode === 'follow') {
      const handleMouseMove = (e: MouseEvent) => {
        const svgEl = svgRef.current
        if (!svgEl) return
        const rect = svgEl.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        const petCenterX = rect.left + rect.width / 2
        const petCenterY = rect.top + rect.height / 2

        const nx = Math.max(-1, Math.min(1, (e.clientX - petCenterX) / (window.innerWidth * 0.38)))
        const ny = Math.max(-1, Math.min(1, (e.clientY - petCenterY) / (window.innerHeight * 0.38)))
        targetGazeRef.current = [nx, ny]
      }

      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [config.gazeMode, config.fixedGaze, config.randomGazeInterval, svgRef])

  // 3. 执行眨眼动画
  const executeBlink = useCallback(() => {
    if (isBlinkingRef.current || runtimeEmotion === 'sleep') return
    isBlinkingRef.current = true
    const startTime = performance.now()
    const duration = 150

    const animateBlink = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      // 对齐原型算法：前半段闭合，后半段睁开
      const currentScaleY =
        progress < 0.5 ? 1.0 - (progress / 0.5) * 0.92 : 0.08 + ((progress - 0.5) / 0.5) * 0.92

      setBlinkScaleY(currentScaleY)

      if (progress < 1) {
        requestAnimationFrame(animateBlink)
      } else {
        setBlinkScaleY(1.0)
        isBlinkingRef.current = false
      }
    }

    requestAnimationFrame(animateBlink)
  }, [runtimeEmotion])

  // 响应外部眨眼触发信号
  useEffect(() => {
    if (blinkSignal > 0) {
      executeBlink()
    }
  }, [blinkSignal, executeBlink])

  // 4. 主渲染循环（每一帧更新物理插值、微动倾斜与人眼 3D 透视比例）
  useEffect(() => {
    let animId: number

    const tick = () => {
      const targetSpacing = getTargetEyeSpacing(runtimeEmotion)
      spacingRef.current += (targetSpacing - spacingRef.current) * 0.15

      // 视向平滑弹簧阻尼插值
      const [curX, curY] = currentGazeRef.current
      const [tarX, tarY] = targetGazeRef.current
      const nextX = curX + (tarX - curX) * 0.14
      const nextY = curY + (tarY - curY) * 0.14
      currentGazeRef.current = [nextX, nextY]

      // 自然仿生定时眨眼
      const now = Date.now()
      if (now > nextBlinkTimeRef.current && !isBlinkingRef.current && runtimeEmotion !== 'sleep') {
        executeBlink()
        nextBlinkTimeRef.current = now + 2600 + Math.random() * 3200
      }

      // 透视算法参数计算
      const maxGazeR = 18.0
      const gazeX = nextX * maxGazeR
      const gazeY = nextY * (maxGazeR * 0.75)

      const dynamicTilt = nextX * 18 - nextY * nextX * 10
      const verticalBaseScale = 1.0 - nextY * 0.16

      // 罗小黑专属大眼比例适配
      let eyeSizeBoost = 1.0
      if (isXiaohei) {
        eyeSizeBoost = 2.1
      }

      // 真实人眼透视（左看：左小右大；右看：左大右小）
      const depthScaleL =
        Math.max(0.7, Math.min(1.3, verticalBaseScale * (1.0 + nextX * 0.22))) * eyeSizeBoost
      const depthScaleR =
        Math.max(0.7, Math.min(1.3, verticalBaseScale * (1.0 - nextX * 0.22))) * eyeSizeBoost

      const widthShrinkL = nextX < 0 ? Math.max(0.75, 1.0 + nextX * 0.25) : 1.0
      const widthShrinkR = nextX > 0 ? Math.max(0.75, 1.0 - nextX * 0.25) : 1.0

      const eyeSpacingScale = 1.0 - Math.abs(nextX) * 0.12
      const halfSpacing = isXiaohei
        ? 27.5 * eyeSpacingScale
        : (spacingRef.current / 2) * eyeSpacingScale

      const eyeLx = headCenter.x + gazeX - halfSpacing
      const eyeLy = headCenter.y + gazeY
      const eyeRx = headCenter.x + gazeX + halfSpacing
      const eyeRy = headCenter.y + gazeY

      // 色彩与实时配置
      const cfg = configRef.current
      if (cfg.gazeMode === 'fixed') {
        targetGazeRef.current = cfg.fixedGaze ?? [0, 0]
      }

      let bodyColor = 'var(--primary)'
      const blushColor = '#FDA4AF'

      if (cfg.colorMode === 'theme') {
        bodyColor = 'var(--primary)'
      } else {
        bodyColor = cfg.customColor || '#34D399'
      }

      // 智能判断身体颜色是否为浅色（包括白色、黄色、粉色、薄荷绿等），自适应眼睛高对比度色值
      const isLightBody = isColorLight(bodyColor)

      // 浅色身体必定使用深黑眼睛；深色自定义身体使用白色眼睛；theme 模式无缝映射系统的 --primary-foreground
      const eyeColor =
        cfg.colorMode === 'theme'
          ? 'var(--primary-foreground)'
          : isLightBody
            ? '#111215'
            : '#FFFFFF'

      const shape = cfg.eyeShape ?? 'capsule'
      const eyeParams: PetEyeParamsMap = {
        ...DEFAULT_EYE_PARAMS,
        ...(cfg.eyeParams ?? {})
      }

      setRenderState({
        currentEyeShape: shape,
        currentEyeParams: eyeParams,
        currentEmotion: runtimeEmotion,
        normX: nextX,
        normY: nextY,
        gazeX,
        gazeY,
        dynamicTilt,
        depthScaleL,
        depthScaleR,
        widthShrinkL,
        widthShrinkR,
        halfSpacing,
        blinkScaleY,
        eyeLx,
        eyeLy,
        eyeRx,
        eyeRy,
        bodyColor,
        eyeColor,
        blushColor
      })

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [runtimeEmotion, isXiaohei, headCenter.x, headCenter.y, blinkScaleY, executeBlink])

  return renderState
}
