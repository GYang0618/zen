import { Button, InputGroup, InputGroupAddon, InputGroupTextarea } from '@zen/ui'
import { Mic, Paperclip, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import type { Variants } from 'motion/react'

const PLACEHOLDERS = ['设置主题为亮色、暗色、跟随系统', '查询、删除、更新、新增用户']

export function ChartInputV2() {
  const [inputValue, setInputValue] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const dynamicPlaceholderActive = showPlaceholder && !isActive && !inputValue

  useEffect(() => {
    if (isActive || inputValue) return

    const interval = setInterval(() => {
      setShowPlaceholder(false)
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
        setShowPlaceholder(true)
      }, 400)
    }, 3000)

    return () => clearInterval(interval)
  }, [isActive, inputValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!inputValue) setIsActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [inputValue])

  return (
    <InputGroup ref={wrapperRef} className="rounded-4xl px-1 py-2 bg-background shadow-lg ">
      <div className="relative w-full">
        <InputGroupTextarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          id="input"
          className="pl-6  max-h-50 overflow-y-auto"
          onFocus={() => setIsActive((a) => !a)}
        />

        <div className="absolute left-6 top-1 w-full pointer-events-none">
          <DynamicTexts active={dynamicPlaceholderActive} activeIndex={placeholderIndex} />
        </div>
      </div>

      <InputGroupAddon align="block-end">
        <Button variant="ghost" className="rounded-full size-11" title="attach file">
          <Paperclip className="size-5" />
        </Button>

        <div className="ml-auto flex gap-2">
          <Button variant="ghost" className="rounded-full size-11" title="Voice input">
            <Mic className="size-5" />
          </Button>
          <Button variant="default" className="rounded-full size-11" title="send">
            <Send className="size-5" />
          </Button>
        </div>
      </InputGroupAddon>
    </InputGroup>
  )
}

function DynamicTexts({ active, activeIndex }: { active: boolean; activeIndex: number }) {
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
  return (
    <AnimatePresence mode="wait">
      {active && (
        <motion.span
          key={activeIndex}
          className="text-gray-400 select-none pointer-events-none"
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
          {PLACEHOLDERS[activeIndex].split('').map((char, i) => (
            <motion.span key={i} variants={letterVariants} style={{ display: 'inline-block' }}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
