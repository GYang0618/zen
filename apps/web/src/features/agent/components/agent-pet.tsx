'use client'

import { cn } from '@zen/ui'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface AgentPetProps {
  isOpen: boolean
  isDragging: boolean
  isTucked: boolean
  isHovered: boolean
  isRunning?: boolean
  className?: string
}

type PetMood = 'normal' | 'happy' | 'sleepy' | 'surprised' | 'open' | 'working'

export function AgentPet({
  isOpen,
  isDragging,
  isTucked,
  isHovered,
  isRunning = false,
  className
}: AgentPetProps) {
  const [isBlinking, setIsBlinking] = useState(false)

  // 情绪状态判定：拖拽惊奇 > 运行思考 > 休眠 > 悬停开心 > 对话打开 > 常态
  let mood: PetMood = 'normal'
  if (isDragging) {
    mood = 'surprised'
  } else if (isRunning) {
    mood = 'working'
  } else if (isTucked) {
    mood = 'sleepy'
  } else if (isHovered && !isOpen) {
    mood = 'happy'
  } else if (isOpen) {
    mood = 'open'
  }

  // 待机自然有机眨眼
  useEffect(() => {
    if (mood !== 'normal') {
      setIsBlinking(false)
      return
    }

    let blinkTimeout: ReturnType<typeof setTimeout>
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      blinkTimeout = setTimeout(() => {
        setIsBlinking(false)
      }, 150)
    }, 3800)

    return () => {
      clearInterval(blinkInterval)
      clearTimeout(blinkTimeout)
    }
  }, [mood])

  return (
    <div className={cn('relative flex size-14 items-center justify-center select-none', className)}>
      {/* 呼吸浮动外层：运行思考时微动频更轻快，传递专注生机 */}
      <motion.div
        className="relative flex size-full items-center justify-center"
        animate={{
          y: isTucked || isDragging ? 0 : isRunning ? [0, -3, 0] : [0, -2, 0],
          scale: isDragging ? 1.06 : isHovered ? 1.03 : 1
        }}
        transition={{
          y: {
            repeat: Number.POSITIVE_INFINITY,
            duration: isRunning ? 1.8 : 3.2,
            ease: 'easeInOut'
          },
          scale: { type: 'spring', stiffness: 320, damping: 22 }
        }}
      >
        {/* 左天线转轴与微透镜 */}
        <motion.div
          className="absolute -top-1 left-2.5 flex size-2.5 items-center justify-center rounded-full border border-border/80 bg-muted shadow-xs dark:border-white/15 dark:bg-zinc-800"
          animate={{
            rotate: isHovered ? -12 : 0,
            y: isHovered ? -1 : 0
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        >
          {/* 主题自适应微光宝石 */}
          <span
            className={cn(
              'size-1 rounded-full bg-primary transition-all duration-300',
              isRunning ? 'animate-pulse opacity-100' : 'opacity-70'
            )}
          />
        </motion.div>

        {/* 右天线转轴与微透镜 */}
        <motion.div
          className="absolute -top-1 right-2.5 flex size-2.5 items-center justify-center rounded-full border border-border/80 bg-muted shadow-xs dark:border-white/15 dark:bg-zinc-800"
          animate={{
            rotate: isHovered ? 12 : 0,
            y: isHovered ? -1 : 0
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        >
          {/* 主题自适应微光宝石 */}
          <span
            className={cn(
              'size-1 rounded-full bg-primary transition-all duration-300',
              isRunning ? 'animate-pulse opacity-100' : 'opacity-70'
            )}
          />
        </motion.div>

        {/* 精工机身外壳：彻底去除生硬 AI 荧光，融合温润陶瓷与深空石墨质感 */}
        <div
          className={cn(
            'relative flex size-13 items-center justify-center rounded-[20px] p-1 transition-all duration-300',
            // 亮色主题：细腻陶瓷白质感，轻盈物理弥散阴影
            'border border-border/80 bg-gradient-to-b from-card via-card to-muted/40 text-card-foreground',
            'shadow-[0_4px_14px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
            // 暗色主题：太空暗黑金属/深石墨微磨砂，深邃沉静
            'dark:border-white/12 dark:bg-gradient-to-b dark:from-zinc-800/95 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-100',
            'dark:shadow-[0_6px_20px_rgba(0,0,0,0.45),0_1px_3px_rgba(0,0,0,0.35)]',
            // 状态联动：根据主题色 token（Primary）自然呼应
            isHovered && 'border-primary/40 shadow-md ring-1 ring-primary/20',
            isOpen && 'border-primary/60 shadow-lg ring-1 ring-primary/30',
            isRunning && 'border-primary shadow-xl ring-2 ring-primary/40'
          )}
        >
          {/* 顶部环境光微倒角反射线，增添物理工业质感 */}
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />

          {/* 弧面矿物玻璃视窗 (Mineral Glass Visor) */}
          <div
            className={cn(
              'relative flex h-7.5 w-11 items-center justify-center overflow-hidden rounded-[12px]',
              'bg-zinc-950 ring-1 ring-black/25 dark:bg-black dark:ring-white/10',
              'shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),inset_0_-1px_1px_rgba(255,255,255,0.06)]'
            )}
          >
            {/* 顶部曲面反光层 */}
            <div className="pointer-events-none absolute inset-x-1 top-0.5 h-2 rounded-t-[10px] bg-gradient-to-b from-white/20 via-white/5 to-transparent" />

            {/* 灵动情绪双眼 */}
            <div className="relative z-10 flex w-full items-center justify-center gap-2">
              <PetEye mood={mood} isBlinking={isBlinking} isHovered={isHovered} side="left" />
              <PetEye mood={mood} isBlinking={isBlinking} isHovered={isHovered} side="right" />
            </div>

            {/* 柔和腮红：随欢快情绪自然浮现 */}
            <motion.div
              className="pointer-events-none absolute bottom-1 inset-x-2.5 flex justify-between px-0.5"
              initial={false}
              animate={{ opacity: mood === 'happy' ? 0.6 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="size-1.5 rounded-full bg-rose-400/40 blur-[1px]" />
              <span className="size-1.5 rounded-full bg-rose-400/40 blur-[1px]" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function PetEye({
  mood,
  isBlinking,
  isHovered,
  side
}: {
  mood: PetMood
  isBlinking: boolean
  isHovered: boolean
  side: 'left' | 'right'
}) {
  // 惊奇状态（拖拽抓起时）：瞳孔微张，带柔和高光
  if (mood === 'surprised') {
    return (
      <div className="relative flex size-3.5 items-center justify-center rounded-full bg-primary drop-shadow-[0_0_4px_var(--primary)]">
        <span className="size-1.5 rounded-full bg-white/90" />
      </div>
    )
  }

  // 运算思考态（Agent 正在推理生成）
  // 告别廉价的 MP3 均衡器跳动，呈现专注呼吸与凝聚智慧的微透镜脉动
  if (mood === 'working') {
    return (
      <motion.div
        className="relative flex size-3 items-center justify-center"
        animate={{ scale: [0.92, 1.08, 0.92] }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 1.6,
          ease: 'easeInOut'
        }}
      >
        {/* 外圈轻柔微光轮廓 */}
        <span className="absolute inset-0 rounded-full border border-primary/40 bg-primary/15" />
        {/* 核心专注光点 */}
        <motion.span
          className="size-1.5 rounded-full bg-primary drop-shadow-[0_0_4px_var(--primary)]"
          animate={{
            scale: [0.8, 1.25, 0.8],
            opacity: [0.75, 1, 0.75]
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1.6,
            delay: side === 'left' ? 0 : 0.2,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    )
  }

  // 瞌睡休眠态（贴边收起状态）：安详小睡弧线
  if (mood === 'sleepy') {
    return (
      <svg aria-hidden="true" className="size-3 text-primary/70" viewBox="0 0 12 12" fill="none">
        <path
          d="M 2,7 C 4,9 8,9 10,7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // 开心状态（鼠标悬停）：纯真笑眼 ^ ^
  if (mood === 'happy') {
    return (
      <svg
        aria-hidden="true"
        className="size-3 text-primary drop-shadow-[0_0_4px_var(--primary)]"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M 2,8 C 4,3 8,3 10,8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // 对话已打开状态：专注陪伴视线，若悬停则笑眼致意
  if (mood === 'open') {
    if (isHovered) {
      return (
        <svg
          aria-hidden="true"
          className="size-3 text-primary drop-shadow-[0_0_4px_var(--primary)]"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M 2,8 C 4,3 8,3 10,8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    }

    return (
      <div className="relative flex h-3 w-2.5 items-center justify-center rounded-full bg-primary drop-shadow-[0_0_4px_var(--primary)]">
        <span
          className={cn(
            'size-0.5 rounded-full bg-white/95',
            side === 'left' ? 'translate-x-[0.5px]' : '-translate-x-[0.5px]'
          )}
        />
      </div>
    )
  }

  // 常态 (normal) 状态：温润的椭圆数码瞳孔 + 自然眨眼与生动高光点
  return (
    <motion.div
      className="relative flex h-3.5 w-2.5 items-start justify-center rounded-full bg-primary pt-0.5 drop-shadow-[0_0_4px_var(--primary)]"
      animate={{
        scaleY: isBlinking ? 0.08 : 1
      }}
      transition={{ duration: 0.12 }}
    >
      {/* 眼神高光小点，赋予生命力与温度 */}
      <span className="size-0.5 rounded-full bg-white/95" />
    </motion.div>
  )
}
