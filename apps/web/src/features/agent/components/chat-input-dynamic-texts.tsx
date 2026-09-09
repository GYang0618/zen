import { AnimatePresence, motion } from 'motion/react'

import type { Variants } from 'motion/react'

export const CHAT_INPUT_PLACEHOLDERS = [
  '设置主题颜色、字体、样式风格',
  '用户、组织、角色、权限管理'
] as const

const placeholderContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.025 } },
  exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } }
}

const letterVariants: Variants = {
  initial: {
    opacity: 0,
    filter: 'blur(12px)',
    y: 10
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      opacity: { duration: 0.25 },
      filter: { duration: 0.4 },
      y: { type: 'spring', stiffness: 80, damping: 20 }
    }
  },
  exit: {
    opacity: 0,
    filter: 'blur(12px)',
    y: -10,
    transition: {
      opacity: { duration: 0.2 },
      filter: { duration: 0.3 },
      y: { type: 'spring' as const, stiffness: 80, damping: 20 }
    }
  }
}

interface ChatInputDynamicTextsProps {
  active: boolean
  activeIndex: number
  placeholders?: readonly string[]
}

export function ChatInputDynamicTexts({
  active,
  activeIndex,
  placeholders = CHAT_INPUT_PLACEHOLDERS
}: ChatInputDynamicTextsProps) {
  const currentText = placeholders[activeIndex] ?? ''

  return (
    <AnimatePresence mode="wait">
      {active && (
        <motion.span
          key={activeIndex}
          className="flex items-center text-base leading-none text-muted-foreground select-none pointer-events-none"
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            zIndex: 0
          }}
          variants={placeholderContainerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {currentText.split('').map((char, i) => (
            <motion.span
              key={`${activeIndex}-${i}`}
              variants={letterVariants}
              className="inline-block leading-none"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
