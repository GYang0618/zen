'use client'

import { cn } from '@zen/ui'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  getBiomimeticExpressiveDuration,
  getBiomimeticNormalDuration,
  PET_EYE_SHAPES,
  Pet,
  pickRandomExpressiveEmotion
} from '@/features/pets'

import { useAgentPetStore } from '../stores/agent-pet-store'

import type { EmotionMode, PetEmotion, PetEyeShape } from '@/features/pets'

interface AgentPetProps {
  isOpen: boolean
  isDragging: boolean
  isTucked: boolean
  isHovered: boolean
  isRunning?: boolean
  squishSignal?: number
  className?: string
}

function pickDifferentItem<T>(pool: readonly T[], current: T): T {
  const filtered = pool.filter((item) => item !== current)
  const candidates = filtered.length > 0 ? filtered : pool
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx] ?? pool[0]!
}

/**
 * Agent 悬浮球宠物适配组件：
 * 默认呈现饱满可爱的球团，支持视向自由跟随鼠标、待机表情随机轮换或固定、
 * 眼睛固定或随机、以及各场景（待机、悬停、打开、拖拽、运行、休眠）自由定制表情。
 */
export function AgentPet({
  isOpen,
  isDragging,
  isTucked,
  isHovered,
  isRunning = false,
  squishSignal,
  className
}: AgentPetProps) {
  const shape = useAgentPetStore((s) => s.shape) || 'orb'
  const eyeShape = useAgentPetStore((s) => s.eyeShape) || 'capsule'
  const eyeShapeMode = useAgentPetStore((s) => s.eyeShapeMode)
  const eyeParams = useAgentPetStore((s) => s.eyeParams)
  const petEmotionMode = useAgentPetStore((s) => s.emotionMode)
  const scenarioEmotions = useAgentPetStore((s) => s.scenarioEmotions)
  const previewEmotion = useAgentPetStore((s) => s.previewEmotion)
  const changeSignal = useAgentPetStore((s) => s.changeSignal)

  // 当全局配置修改时，提供即时果冻弹跳反馈
  const [changeSquish, setChangeSquish] = useState(0)
  useEffect(() => {
    if (changeSignal > 0) {
      setChangeSquish((c) => c + 1)
    }
  }, [changeSignal])

  // 监听会话关闭动作：当 isOpen 从 true 变为 false 时，呈现 1.6 秒温柔的关闭告别反馈
  const [justClosed, setJustClosed] = useState(false)
  const prevOpenRef = useRef(isOpen)

  useEffect(() => {
    if (prevOpenRef.current && !isOpen) {
      setJustClosed(true)
      const timer = setTimeout(() => {
        setJustClosed(false)
      }, 1600)
      return () => clearTimeout(timer)
    }
    prevOpenRef.current = isOpen
  }, [isOpen])

  // 鼠标悬停表情机制：首次悬停呈现定制场景表情（默认微笑 happy），保持 2.5s~4.5s 友好问候，
  // 随后进入拟真循环：自然 (5-10s) -> 随机生动微表情 (2-5s) -> 自然 (5-10s)
  const [hoverEmotion, setHoverEmotion] = useState<PetEmotion>('happy')
  useEffect(() => {
    if (!isHovered || isOpen) {
      setHoverEmotion(scenarioEmotions.hover)
      return
    }

    setHoverEmotion(scenarioEmotions.hover)

    let timer: ReturnType<typeof setTimeout>
    let isNormalPhase = true
    let lastExpressive: PetEmotion = scenarioEmotions.hover

    const scheduleNextHover = () => {
      if (isNormalPhase) {
        setHoverEmotion('normal')
        isNormalPhase = false
        const delayMs = getBiomimeticNormalDuration()
        timer = setTimeout(scheduleNextHover, delayMs)
      } else {
        const nextEmo = pickRandomExpressiveEmotion(lastExpressive)
        lastExpressive = nextEmo
        setHoverEmotion(nextEmo)
        isNormalPhase = true
        const delayMs = getBiomimeticExpressiveDuration(nextEmo)
        timer = setTimeout(scheduleNextHover, delayMs)
      }
    }

    const greetingDuration = getBiomimeticExpressiveDuration(scenarioEmotions.hover)
    timer = setTimeout(scheduleNextHover, greetingDuration)

    return () => clearTimeout(timer)
  }, [isHovered, isOpen, scenarioEmotions.hover])

  // 待机拟真随机表情与眼型轮换：
  // 以自然表情 (normal) 为基线主导 (5-10s)，随机穿插生动非自然微表情 (2-5s)
  // 循环节奏：自然 (5-10s) -> 随机表情 (2-5s) -> 自然 (5-10s) -> ...
  const [idleEmotion, setIdleEmotion] = useState<PetEmotion>('normal')
  const [randomEyeShape, setRandomEyeShape] = useState<PetEyeShape>('capsule')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let isNormalPhase = false
    let lastExpressive: PetEmotion = 'happy'

    const scheduleNextIdle = () => {
      if (isNormalPhase) {
        // 回归自然基线状态，同时在此刻轻巧变幻眼型（若开启随机眼型）
        setIdleEmotion('normal')
        setRandomEyeShape((prev) => pickDifferentItem(PET_EYE_SHAPES, prev))
        isNormalPhase = false
        const delayMs = getBiomimeticNormalDuration()
        timer = setTimeout(scheduleNextIdle, delayMs)
      } else {
        // 浮现随机生动表情 (2-5s)
        const nextEmo = pickRandomExpressiveEmotion(lastExpressive)
        lastExpressive = nextEmo
        setIdleEmotion(nextEmo)
        isNormalPhase = true
        const delayMs = getBiomimeticExpressiveDuration(nextEmo)
        timer = setTimeout(scheduleNextIdle, delayMs)
      }
    }

    const initialDelay = getBiomimeticNormalDuration()
    timer = setTimeout(scheduleNextIdle, initialDelay)

    return () => clearTimeout(timer)
  }, [])

  // 动态表情决议
  // 优先级：临时预览 > 贴边休眠 > 拖拽中 > 思考中 > 悬停中 > 打开中 > 关闭短反馈 > 待机（固定或随机）
  const { emotion, emotionMode }: { emotion: PetEmotion; emotionMode: EmotionMode } =
    useMemo(() => {
      if (previewEmotion) {
        return { emotion: previewEmotion, emotionMode: 'fixed' }
      }
      if (isTucked) {
        return { emotion: scenarioEmotions.tucked, emotionMode: 'fixed' }
      }
      if (isDragging) {
        return { emotion: scenarioEmotions.drag, emotionMode: 'fixed' }
      }
      if (isRunning) {
        return { emotion: scenarioEmotions.running, emotionMode: 'fixed' }
      }
      if (isHovered && !isOpen) {
        return { emotion: hoverEmotion, emotionMode: 'fixed' }
      }
      if (isOpen) {
        return { emotion: scenarioEmotions.open, emotionMode: 'fixed' }
      }
      if (justClosed) {
        return { emotion: 'wink', emotionMode: 'fixed' }
      }
      if (petEmotionMode === 'fixed') {
        return { emotion: scenarioEmotions.idle, emotionMode: 'fixed' }
      }
      // 常态待机：随机轮换
      return { emotion: idleEmotion, emotionMode: 'fixed' }
    }, [
      previewEmotion,
      isTucked,
      scenarioEmotions.tucked,
      scenarioEmotions.drag,
      scenarioEmotions.running,
      scenarioEmotions.open,
      scenarioEmotions.idle,
      isDragging,
      isRunning,
      isHovered,
      isOpen,
      hoverEmotion,
      justClosed,
      petEmotionMode,
      idleEmotion
    ])

  const resolvedEyeShape = eyeShapeMode === 'random' ? randomEyeShape : eyeShape

  return (
    <div
      className={cn(
        'relative flex size-16 items-center justify-center select-none overflow-visible',
        className
      )}
    >
      {/* 呼吸与交互微动外层 */}
      <motion.div
        className="relative flex size-full items-center justify-center"
        animate={{
          y: isTucked || isDragging ? 0 : isRunning ? [0, -3, 0] : [0, -1.8, 0],
          scale: isDragging ? 1.08 : isHovered ? 1.06 : 1,
          rotate: isDragging ? [0, -3, 3, 0] : 0
        }}
        transition={{
          y: {
            repeat: Number.POSITIVE_INFINITY,
            duration: isRunning ? 1.8 : 3.4,
            ease: 'easeInOut'
          },
          scale: { type: 'spring', stiffness: 340, damping: 20 },
          rotate: isDragging
            ? { repeat: Number.POSITIVE_INFINITY, duration: 0.6, ease: 'easeInOut' }
            : { duration: 0.2 }
        }}
      >
        {/* 运行思考中顶部专注呼吸微光指示 */}
        {isRunning && (
          <span className="absolute -top-1 -right-1 z-30 size-2 animate-ping rounded-full bg-primary" />
        )}

        {/* 核心球团宠物渲染：无任何方框背景，大球团圆滚滚充满视野，点击触发 Q 弹果冻弹跳 */}
        <div
          className={cn(
            'relative flex size-full items-center justify-center transition-all duration-300',
            // 物理阴影与环境光微漫反射，暗夜明亮，白昼立体
            'drop-shadow-[0_6px_16px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]',
            isHovered && 'drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
            isOpen && 'drop-shadow-[0_8px_28px_rgba(var(--primary),0.35)]',
            isRunning && 'drop-shadow-[0_0_18px_var(--primary)]'
          )}
        >
          <Pet
            key={`${shape}-${resolvedEyeShape}`}
            shape={shape}
            eyeShape={resolvedEyeShape}
            eyeParams={eyeParams}
            emotion={emotion}
            emotionMode={emotionMode}
            gazeMode={isTucked ? 'fixed' : 'follow'}
            fixedGaze={[0, 0]}
            colorMode="theme"
            size={64}
            showShadow={false}
            enableSquishOnClick={true}
            squishSignal={(squishSignal ?? 0) + changeSquish}
            className="size-full scale-[1.28] transition-transform duration-200"
          />
        </div>
      </motion.div>
    </div>
  )
}
