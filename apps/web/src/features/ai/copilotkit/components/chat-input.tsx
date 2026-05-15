'use client'

import { randomUUID, useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { Button } from '@zen/ui'
import { Globe, Lightbulb, Mic, Paperclip, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import type { Variants } from 'motion/react'

const PLACEHOLDERS = [
  '用 HextaUI 生成网站',
  '用 Next.js 创建新项目',
  '生命的意义是什么？',
  '学习 React 最好的方式是什么？',
  '如何烹饪美味的餐点？',
  '请总结这篇文章'
]

export function ChatInput() {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [thinkActive, setThinkActive] = useState(false)
  const [deepSearchActive, setDeepSearchActive] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  const sendMessage = async () => {
    if (!inputValue.trim()) return
    agent.addMessage({
      id: randomUUID(),
      role: 'user',
      content: inputValue
    })
    setInputValue('')
    await copilotkit.runAgent({ agent })
  }

  return (
    <div className="w-full  flex justify-center items-center">
      <motion.div
        ref={wrapperRef}
        className="w-full rounded-4xl overflow-hidden bg-background"
        variants={containerVariants}
        animate={isActive || inputValue ? 'expanded' : 'collapsed'}
        initial="collapsed"
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          <div className="flex items-center gap-2 p-3 rounded-full bg-background  w-full">
            <Button
              variant="ghost"
              className="rounded-full size-11"
              title="attach file"
              type="button"
              tabIndex={-1}
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
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none"
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
                      {PLACEHOLDERS[placeholderIndex].split('').map((char, i) => (
                        <motion.span
                          key={i}
                          variants={letterVariants}
                          style={{ display: 'inline-block' }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button variant="ghost" className="rounded-full size-11" title="Voice input">
              <Mic className="size-5" />
            </Button>

            <Button
              className="rounded-full size-11"
              title="send"
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault()
                sendMessage()
              }}
            >
              <Send className="size-4.5" />
            </Button>
          </div>

          {/* Expanded Controls */}

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
            animate={isActive || inputValue ? 'visible' : 'hidden'}
            style={{ marginTop: 8 }}
          >
            <div className="flex gap-3 items-center">
              {/* Think Toggle */}

              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all font-medium group ${
                  thinkActive
                    ? 'bg-blue-600/10 outline outline-blue-600/60 text-blue-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start  ${
                  deepSearchActive
                    ? 'bg-blue-600/10 outline outline-blue-600/60 text-blue-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeepSearchActive((a) => !a)
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 125 : 36,
                  paddingLeft: deepSearchActive ? 8 : 9
                }}
              >
                <div className="flex-1">
                  <Globe size={18} />
                </div>
                <motion.span
                  className="pb-[2px]"
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
        </div>
      </motion.div>
    </div>
  )
}
