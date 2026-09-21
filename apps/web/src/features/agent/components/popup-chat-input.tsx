'use client'

import { useCopilotChatConfiguration } from '@copilotkit/react-core/v2'
import { Button, cn } from '@zen/ui'
import { Mic, Paperclip, Send, Square } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useAgentPopupContext } from '../context/agent-popup-context'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { CHAT_INPUT_PLACEHOLDERS, ChatInputDynamicTexts } from './chat-input-dynamic-texts'

import type { CopilotChatInputProps } from '@copilotkit/react-core/v2'

const POPUP_TEXTAREA_MAX_HEIGHT_PX = 140
const POPUP_SIDE_ACTIONS_WIDTH_PX = 110

export function PopupChatInput({
  onSubmitMessage,
  onStop,
  isRunning = false,
  onAddFile,
  onStartTranscribe,
  value: controlledValue,
  onChange,
  showDisclaimer = true,
  className
}: CopilotChatInputProps) {
  const configuration = useCopilotChatConfiguration()
  const popupContext = useAgentPopupContext()
  const labels = configuration?.labels

  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const inputValue = isControlled ? controlledValue : internalValue

  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [isMultiline, setIsMultiline] = useState(false)

  const editDraft = useAgentChatInputStore((state) => state.editDraft)
  const clearEditDraft = useAgentChatInputStore((state) => state.clearEditDraft)
  const markThreadRunning = useAgentChatInputStore((state) => state.markThreadRunning)

  const currentThreadId = popupContext?.threadId ?? configuration?.threadId ?? 'popup-thread'

  // 同步当前会话运行状态到全局 store，驱动悬浮球小宠物的思考动效
  useEffect(() => {
    markThreadRunning(currentThreadId, isRunning)
    return () => {
      markThreadRunning(currentThreadId, false)
    }
  }, [currentThreadId, isRunning, markThreadRunning])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const singleLineHeightRef = useRef<number | null>(null)

  // 接收从消息列表“重新编辑”派发的草稿
  useEffect(() => {
    if (!editDraft) return
    const text = editDraft.text
    if (!isControlled) {
      setInternalValue(text)
    }
    onChange?.(text)
    setIsActive(true)
    clearEditDraft()

    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (el) {
        el.focus()
        const length = el.value.length
        el.setSelectionRange(length, length)
      }
    })
  }, [editDraft, clearEditDraft, isControlled, onChange])

  // 占位符轮播
  useEffect(() => {
    if (isActive || inputValue) return

    const interval = setInterval(() => {
      setShowPlaceholder(false)
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % CHAT_INPUT_PLACEHOLDERS.length)
        setShowPlaceholder(true)
      }, 400)
    }, 3000)

    return () => clearInterval(interval)
  }, [isActive, inputValue])

  // 点击外部处理激活状态
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!inputValue) setIsActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [inputValue])

  // 自适应高度与多行状态计算
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    if (singleLineHeightRef.current === null) {
      singleLineHeightRef.current = el.scrollHeight
    }

    const singleLineHeight = singleLineHeightRef.current
    const nextHeight = Math.min(el.scrollHeight, POPUP_TEXTAREA_MAX_HEIGHT_PX)
    el.style.height = `${nextHeight}px`

    if (!inputValue) {
      setIsMultiline(false)
      return
    }

    if (inputValue.includes('\n')) {
      setIsMultiline(true)
      return
    }

    const probeWidth = Math.max(
      el.clientWidth - (isMultiline ? POPUP_SIDE_ACTIONS_WIDTH_PX : 0),
      80
    )
    const prevWidth = el.style.width
    el.style.width = `${probeWidth}px`
    el.style.height = 'auto'
    const probedScrollHeight = el.scrollHeight
    el.style.width = prevWidth
    el.style.height = `${nextHeight}px`

    setIsMultiline(probedScrollHeight > singleLineHeight + 2)
  }, [inputValue, isMultiline])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
  }

  const handlePrimaryAction = useCallback(() => {
    if (isRunning) {
      onStop?.()
      return
    }

    const trimmed = inputValue.trim()
    if (!trimmed || !onSubmitMessage) return

    onSubmitMessage(trimmed)
    if (!isControlled) {
      setInternalValue('')
    }
    onChange?.('')
    setIsActive(false)
  }, [isRunning, onStop, inputValue, onSubmitMessage, isControlled, onChange])

  const dynamicPlaceholderActive = showPlaceholder && !isActive && !inputValue

  const attachButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
      title="上传附件"
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation()
        onAddFile?.()
      }}
    >
      <Paperclip className="size-4" />
    </Button>
  )

  const trailingActions = (
    <>
      {onStartTranscribe && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          title="语音输入"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            onStartTranscribe()
          }}
        >
          <Mic className="size-4" />
        </Button>
      )}

      <Button
        type="button"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        title={isRunning ? '停止' : '发送'}
        aria-label={isRunning ? '停止生成' : '发送'}
        tabIndex={-1}
        disabled={!isRunning && !inputValue.trim()}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handlePrimaryAction()
        }}
      >
        {isRunning ? <Square className="size-3.5 fill-current" /> : <Send className="size-3.5" />}
      </Button>
    </>
  )

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full flex-col items-center px-3 pb-3 pt-1',
        className
      )}
    >
      <div
        ref={wrapperRef}
        className={cn(
          'w-full overflow-hidden border border-border/40 bg-background shadow-sm transition-[border-radius] duration-200 dark:bg-input/30',
          isMultiline ? 'rounded-3xl' : 'rounded-full'
        )}
      >
        <div className="flex w-full flex-col items-stretch">
          <div
            className={cn('flex w-full gap-1.5 p-2', isMultiline ? 'items-start' : 'items-center')}
          >
            {!isMultiline && attachButton}

            <div className="relative grid min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                disabled={isRunning}
                aria-label="发送消息"
                onChange={handleInputChange}
                className="col-start-1 row-start-1 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 py-1.5 text-sm font-normal leading-5 outline-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                onFocus={() => setIsActive(true)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
                  e.preventDefault()
                  e.stopPropagation()
                  handlePrimaryAction()
                }}
              />
              <div className="pointer-events-none col-start-1 row-start-1 flex min-w-0 items-center px-2">
                <ChatInputDynamicTexts
                  active={dynamicPlaceholderActive}
                  activeIndex={placeholderIndex}
                />
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
                <div className="flex w-full items-center justify-between gap-2 px-2.5 pb-2">
                  {attachButton}
                  <div className="flex items-center gap-1.5">{trailingActions}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showDisclaimer && labels?.chatDisclaimerText && (
        <p className="mt-1.5 select-none text-center text-[11px] text-muted-foreground/60">
          {labels.chatDisclaimerText}
        </p>
      )}
    </div>
  )
}
