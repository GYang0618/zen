'use client'

import { randomUUID, useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { Button, cn } from '@zen/ui'
import { Mic, Paperclip, Send, Square } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { Variants } from 'motion/react'

const PLACEHOLDERS = ['设置主题为亮色、暗色、跟随系统', '查询、删除、更新、新增用户']
const TEXTAREA_MAX_HEIGHT_PX = 200
/** 单行布局下两侧按钮占用的大致宽度，用于跨行检测时避免宽窄切换抖动 */
const SIDE_ACTIONS_WIDTH_PX = 160

export function ChatInput({ className }: { className?: string }) {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isMultiline, setIsMultiline] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const singleLineHeightRef = useRef<number | null>(null)

  const dynamicPlaceholderActive =
    showPlaceholder && !isActive && !inputValue && agent.messages.length === 0

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

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    if (singleLineHeightRef.current === null) {
      singleLineHeightRef.current = el.scrollHeight
    }

    const singleLineHeight = singleLineHeightRef.current
    const nextHeight = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)
    el.style.height = `${nextHeight}px`

    if (!inputValue) {
      setIsMultiline(false)
      return
    }

    if (inputValue.includes('\n')) {
      setIsMultiline(true)
      return
    }

    // 在「单行布局」对应的窄宽度下测量，避免按钮移到底部后变宽又判回单行
    const probeWidth = Math.max(el.clientWidth - (isMultiline ? SIDE_ACTIONS_WIDTH_PX : 0), 80)
    const prevWidth = el.style.width
    el.style.width = `${probeWidth}px`
    el.style.height = 'auto'
    const probedScrollHeight = el.scrollHeight
    el.style.width = prevWidth
    el.style.height = `${nextHeight}px`

    setIsMultiline(probedScrollHeight > singleLineHeight + 2)
  }, [inputValue, isMultiline])

  const handleActivate = () => setIsActive(true)

  const isRunning = agent.isRunning
  const canSend = inputValue.trim().length > 0 && !isRunning

  const stopAgent = () => {
    try {
      copilotkit.stopAgent({ agent })
    } catch (error) {
      console.error('CopilotChat: stopAgent failed', error)
      try {
        agent.abortRun()
      } catch (abortError) {
        console.error('CopilotChat: abortRun fallback failed', abortError)
      }
    }
  }

  const sendMessage = async () => {
    if (!canSend) return
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

  const handlePrimaryAction = () => {
    if (isRunning) {
      stopAgent()
      return
    }
    void sendMessage()
  }

  const attachButton = (
    <Button
      variant="ghost"
      className="rounded-full size-11 shrink-0"
      title="attach file"
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
    >
      <Paperclip className="size-5" />
    </Button>
  )

  const trailingActions = (
    <>
      <Button
        variant="ghost"
        className="rounded-full size-11 shrink-0"
        title="Voice input"
        onClick={(e) => e.stopPropagation()}
      >
        <Mic className="size-5" />
      </Button>

      <Button
        className="rounded-full size-11 shrink-0"
        type="button"
        title={isRunning ? '停止' : '发送'}
        aria-label={isRunning ? '停止生成' : '发送'}
        tabIndex={-1}
        disabled={!isRunning && !canSend}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handlePrimaryAction()
        }}
      >
        {isRunning ? (
          <Square className="size-3.5 fill-current" />
        ) : (
          <Send className="size-4.5" />
        )}
      </Button>
    </>
  )

  return (
    <div className={cn('w-full flex justify-center items-center', className)}>
      <div
        ref={wrapperRef}
        className="w-full rounded-4xl overflow-hidden bg-background dark:bg-input/30 shadow-sm"
      >
        <div className="flex flex-col items-stretch w-full">
          {/* todo: 添加上传的文件或者图片预览展示 */}
          <div
            className={cn('flex gap-2 p-3 w-full', isMultiline ? 'items-start' : 'items-center')}
          >
            {!isMultiline && attachButton}

            <div className="relative flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal resize-none overflow-y-auto leading-6"
                style={{ position: 'relative', zIndex: 1 }}
                onFocus={handleActivate}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
                  e.preventDefault()
                  e.stopPropagation()
                  handlePrimaryAction()
                }}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-start py-2">
                <DynamicTexts active={dynamicPlaceholderActive} activeIndex={placeholderIndex} />
              </div>
            </div>

            {!isMultiline && trailingActions}
          </div>

          <AnimatePresence initial={false}>
            {isMultiline && (
              <motion.div
                key="multiline-actions"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="overflow-hidden"
              >
                <div className="flex w-full items-center justify-between gap-3 px-3 pb-3">
                  {attachButton}
                  <div className="flex items-center gap-2">{trailingActions}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
