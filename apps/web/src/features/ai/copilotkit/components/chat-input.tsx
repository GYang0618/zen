'use client'

import { randomUUID, useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { Button } from '@zen/ui'
import { Globe, Lightbulb, Mic, Paperclip, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import type { Variants } from 'motion/react'

const PLACEHOLDERS = ['设置主题为亮色、暗色、跟随系统', '查询、删除、更新、新增用户']

export function ChatInput() {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)

  const [inputValue, setInputValue] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dynamicPlaceholderActive =
    showPlaceholder && !isActive && !inputValue && agent.messages.length === 0

  // Cycle placeholder text when input is inactive
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

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!inputValue) setIsActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [inputValue])

  const handleActivate = () => setIsActive(true)

  const containerVariants: Variants = {
    collapsed: {
      height: 68,
      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 }
    },
    expanded: {
      height: 128,
      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.16)',
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 }
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return
    agent.addMessage({
      id: randomUUID(),
      role: 'user',
      content: inputValue
    })
    setInputValue('')
    try {
      await copilotkit.runAgent({ agent })
    } catch (error) {
      console.error('CopilotChat: runAgent failed', error)
    }
  }

  return (
    <div className="w-full flex justify-center items-center">
      <motion.div
        ref={wrapperRef}
        className="w-full rounded-4xl overflow-hidden bg-background dark:bg-input/30"
        variants={containerVariants}
        animate={isActive || inputValue ? 'expanded' : 'collapsed'}
        initial="collapsed"
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* todo: 添加上传的文件或者图片预览展示 */}
          <div className="flex items-center gap-2 p-3 rounded-full w-full">
            <Button
              variant="ghost"
              className="rounded-full size-11"
              title="attach file"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            >
              <Paperclip className="size-5" />
            </Button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal"
                style={{ position: 'relative', zIndex: 1 }}
                onFocus={handleActivate}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
                  e.preventDefault()
                  e.stopPropagation()
                  void sendMessage()
                }}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center  py-2">
                <DynamicTexts active={dynamicPlaceholderActive} activeIndex={placeholderIndex} />
              </div>
            </div>

            <Button
              variant="ghost"
              className="rounded-full size-11"
              title="Voice input"
              onClick={(e) => e.stopPropagation()}
            >
              <Mic className="size-5" />
            </Button>

            <Button
              className="rounded-full size-11"
              title="send"
              tabIndex={-1}
              disabled={!inputValue}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                sendMessage()
              }}
            >
              <Send className="size-4.5" />
            </Button>
          </div>

          {/* Expanded Controls */}
          <ExpandedControls active={isActive || !!inputValue} />
        </div>
      </motion.div>
    </div>
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

function ExpandedControls({ active }: { active: boolean }) {
  const TOGGLE_PILL_BASE =
    'flex items-center gap-1 border px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap overflow-hidden justify-start'
  const TOGGLE_PILL_INACTIVE =
    'border-border bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground'
  const TOGGLE_PILL_ACTIVE =
    'border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90'

  const [thinkActive, setThinkActive] = useState(false)
  const [deepSearchActive, setDeepSearchActive] = useState(false)
  return (
    <motion.div
      className="w-full flex justify-start px-4 items-center text-sm"
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
          pointerEvents: 'none' as const,
          transition: { duration: 0.25 }
        },
        visible: {
          opacity: 1,
          y: 0,
          pointerEvents: 'auto' as const,
          transition: { duration: 0.35, delay: 0.08 }
        }
      }}
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
      style={{ marginTop: 8 }}
    >
      <div className="flex gap-3 items-center">
        {/* Think Toggle */}

        <button
          className={`${TOGGLE_PILL_BASE} group ${
            thinkActive ? TOGGLE_PILL_ACTIVE : TOGGLE_PILL_INACTIVE
          }`}
          title="Think"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setThinkActive((a) => !a)
          }}
        >
          <Lightbulb className="group-hover:fill-yellow-300 transition-all" size={18} />
          深度思考
        </button>

        {/* Deep Search Toggle */}
        <motion.button
          className={`${TOGGLE_PILL_BASE} ${
            deepSearchActive ? TOGGLE_PILL_ACTIVE : TOGGLE_PILL_INACTIVE
          }`}
          title="Deep Search"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDeepSearchActive((a) => !a)
          }}
          initial={false}
          animate={{
            width: deepSearchActive ? 'max-content' : 36,
            paddingLeft: deepSearchActive ? 8 : 9
          }}
        >
          <div className="flex-1">
            <Globe size={18} />
          </div>
          <motion.span
            initial={false}
            animate={{
              opacity: deepSearchActive ? 1 : 0
            }}
          >
            深度搜索
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  )
}
