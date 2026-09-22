'use client'

import { cn } from '@zen/ui'
import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'

import { useTheme } from '@/context/theme-provider'
import { Pet, PRESET_PETS, THREAD_PET_PALETTES } from '@/features/pets'

import type { PetEmotion } from '@/features/pets'

interface GreetingPetProps {
  threadId?: string
  className?: string
}

/** 高离散度 32-bit MurmurHash3 算法，无位偏置，保证随机性充分均匀 */
function hashString(str: string): number {
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

/**
 * 欢迎屏会话专属宠物：
 * - 每个新会话/threadId 随机生成专属宠物（随机形状 + 随机颜色）
 * - 眼型固定微胶囊眼 (capsule)
 * - 自动适应浅色/暗色主题，保持高对比度与自然视觉
 * - 响应外层容器宽度自适应尺寸（popup 下紧凑，chat 宽屏下充盈）
 */
export function GreetingPet({ threadId, className }: GreetingPetProps) {
  const { resolvedTheme } = useTheme()

  const [fallbackSeed] = useState(() => Math.floor(Math.random() * 10000000))

  const { shape, palette } = useMemo(() => {
    const shapeList = PRESET_PETS.map((p) => p.id)
    const baseId = threadId || `fallback-${fallbackSeed}`
    const shapeSeed = hashString(`${baseId}:shape`)
    const colorSeed = hashString(`${baseId}:color`)
    const shapeIndex = shapeSeed % shapeList.length
    const colorIndex = colorSeed % THREAD_PET_PALETTES.length
    return {
      shape: shapeList[shapeIndex] ?? 'orb',
      palette: THREAD_PET_PALETTES[colorIndex] ?? THREAD_PET_PALETTES[0]
    }
  }, [threadId, fallbackSeed])

  const petColor = resolvedTheme === 'dark' ? palette.dark : palette.light

  const [isHovered, setIsHovered] = useState(false)
  const [squishSignal, setSquishSignal] = useState(0)
  const [clickEmotion, setClickEmotion] = useState<PetEmotion | null>(null)

  const handlePetClick = useCallback(() => {
    setSquishSignal((c) => c + 1)
    setClickEmotion('wink')
    const timer = setTimeout(() => {
      setClickEmotion(null)
    }, 1400)
    return () => clearTimeout(timer)
  }, [])

  const activeEmotion: PetEmotion = useMemo(() => {
    if (clickEmotion) return clickEmotion
    if (isHovered) return 'happy'
    return 'normal'
  }, [clickEmotion, isHovered])

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none',
        'size-20 @sm:size-24 @xl:size-28 @3xl:size-32 transition-all duration-300',
        className
      )}
    >
      <motion.div
        animate={{ y: [0, -3.5, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.4, ease: 'easeInOut' }}
        className="relative flex size-full items-center justify-center"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handlePetClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handlePetClick()
            }
          }}
          className={cn(
            'relative flex size-full cursor-pointer items-center justify-center transition-transform duration-200',
            'drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_8px_22px_rgba(0,0,0,0.5)]',
            'hover:scale-105 active:scale-95'
          )}
          title="点击与宠物互动"
          aria-label="AI 助手宠物，点击互动"
        >
          <Pet
            shape={shape}
            eyeShape="capsule"
            emotion={activeEmotion}
            emotionMode="fixed"
            gazeMode="follow"
            fixedGaze={[0, 0]}
            colorMode="custom"
            color={petColor}
            width="100%"
            height="100%"
            showShadow={false}
            enableSquishOnClick={true}
            squishSignal={squishSignal}
          />
        </div>
      </motion.div>
    </div>
  )
}
