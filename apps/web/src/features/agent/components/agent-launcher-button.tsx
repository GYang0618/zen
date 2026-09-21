import { useCopilotChatConfiguration } from '@copilotkit/react-core/v2'
import { Button, cn } from '@zen/ui'
import { forwardRef, useCallback, useEffect, useState } from 'react'

import { useBodyPointerBlocked } from '../hooks/use-body-pointer-blocked'
import { useEdgeDock } from '../hooks/use-edge-dock'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { AgentPet } from './agent-pet'

import type { CopilotChatToggleButtonProps } from '@copilotkit/react-core/v2'
import type { MouseEventHandler } from 'react'

/** 悬浮球直径，与 size-14 保持一致 */
const LAUNCHER_SIZE = 56
const EDGE_MARGIN = 24
const POSITION_STORAGE_KEY = 'zen.agent.launcher-position'
/** 吸附隐藏时藏到视口外的比例 */
const TUCK_HIDDEN_RATIO = 0.55
/** 吸附隐藏时的水平位移（px）：先跨过边距，再把大半个球藏到视口外 */
const TUCK_SHIFT = EDGE_MARGIN + LAUNCHER_SIZE * TUCK_HIDDEN_RATIO
/** 首次进入页面时完整展示的时长（ms），之后才开始自动吸附隐藏 */
const INITIAL_REVEAL_DURATION = 2000
/** 唤醒热区在球体外扩展的距离（px） */
const HOT_ZONE_PADDING = 8
/** 展开状态下离底部的安全边距（px）：确保与上方的弹窗（底部 96px）留出 20px 的干净留白 */
const OPEN_BOTTOM_MARGIN = 20

type AgentLauncherButtonProps = Omit<CopilotChatToggleButtonProps, 'openIcon' | 'closeIcon'>

/**
 * 可拖拽的 Agent 悬浮球：松手后吸附到最近的视口边缘，
 * 空闲时半隐藏，指针悬停、键盘聚焦或会话打开时恢复完整显示。
 * 打开状态下自动锚定到与弹窗严格不重叠的安全独立停靠区，杜绝遮挡。
 */
export const AgentLauncherButton = forwardRef<HTMLButtonElement, AgentLauncherButtonProps>(
  function AgentLauncherButton({ className, onClick, ...props }, ref) {
    const configuration = useCopilotChatConfiguration()
    const isInert = useBodyPointerBlocked()
    const [isPointerNear, setIsPointerNear] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [canTuck, setCanTuck] = useState(false)
    const [windowSize, setWindowSize] = useState(() => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 1200,
      height: typeof window !== 'undefined' ? window.innerHeight : 800
    }))

    const { position, side, isDragging, consumeDragClick, dragHandlers } = useEdgeDock({
      size: LAUNCHER_SIZE,
      margin: EDGE_MARGIN,
      storageKey: POSITION_STORAGE_KEY
    })

    useEffect(() => {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    const isOpen = configuration?.isModalOpen ?? false
    const runningThreadIds = useAgentChatInputStore((state) => state.runningThreadIds)
    const isRunning = runningThreadIds.size > 0

    /**
     * 打开状态下，小宠物平滑停靠在弹窗（bottom: 96px）下方的独立停靠位，
     * 间距留白达 20px，保证完全不产生视线与交互遮挡；移动端贴于右上角。
     */
    const isDesktop = windowSize.width >= 768
    const effectivePosition = isOpen
      ? isDesktop
        ? {
            x: windowSize.width - LAUNCHER_SIZE - EDGE_MARGIN,
            y: windowSize.height - LAUNCHER_SIZE - OPEN_BOTTOM_MARGIN
          }
        : {
            x: windowSize.width - LAUNCHER_SIZE - 16,
            y: 16
          }
      : position

    /**
     * 热区固定覆盖「收起时露出的部分」到「展开后的整颗球」，并一直延伸到视口边缘。
     * 不能直接用球体的 pointerenter / pointerleave：球滑出后会离开光标，
     * 触发 leave 又收起、再次进入 hover，形成来回抖动。
     */
    const isInHotZone = useCallback(
      (clientX: number, clientY: number) => {
        if (isOpen) return false

        const withinY =
          clientY >= position.y - HOT_ZONE_PADDING &&
          clientY <= position.y + LAUNCHER_SIZE + HOT_ZONE_PADDING

        if (!withinY) return false

        return side === 'left'
          ? clientX <= position.x + LAUNCHER_SIZE + HOT_ZONE_PADDING
          : clientX >= position.x - HOT_ZONE_PADDING
      },
      [isOpen, position.x, position.y, side]
    )

    useEffect(() => {
      if (isOpen) return

      const handlePointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return

        const next = isInHotZone(event.clientX, event.clientY)
        setIsPointerNear((prev) => (prev === next ? prev : next))
      }

      window.addEventListener('pointermove', handlePointerMove)
      return () => window.removeEventListener('pointermove', handlePointerMove)
    }, [isInHotZone, isOpen])

    useEffect(() => {
      const timer = setTimeout(() => setCanTuck(true), INITIAL_REVEAL_DURATION)
      return () => clearTimeout(timer)
    }, [])

    const isTucked = canTuck && !isOpen && !isDragging && !isPointerNear && !isFocused

    const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      // 拖拽结束后浏览器仍会补发一次 click，这里丢弃它，避免误开关会话
      if (!isOpen && consumeDragClick()) return

      configuration?.setModalOpen(!isOpen)
    }

    return (
      <Button
        {...props}
        ref={ref}
        type="button"
        variant="ghost"
        data-copilotkit
        data-slot="chat-toggle-button"
        data-state={isOpen ? 'open' : 'closed'}
        aria-label={isOpen ? '关闭 AI 助手' : '打开 AI 助手'}
        aria-pressed={isOpen}
        className={cn(
          'fixed z-[1300] size-14 p-0 touch-none rounded-2xl bg-transparent hover:bg-transparent shadow-none transition-[left,top,transform,opacity] duration-300 ease-out',
          isOpen ? 'cursor-pointer' : isDragging ? 'cursor-grabbing duration-0' : 'cursor-grab',
          isTucked && 'opacity-70',
          // 模态层已屏蔽外部交互，此时球不可用，淡出避免造成可点击的错觉
          isInert && 'pointer-events-none opacity-0',
          className
        )}
        style={{
          left: effectivePosition.x,
          top: effectivePosition.y,
          transform: isTucked
            ? `translateX(${side === 'left' ? -TUCK_SHIFT : TUCK_SHIFT}px)`
            : undefined
        }}
        onClick={handleClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...(isOpen ? {} : dragHandlers)}
      >
        <AgentPet
          isOpen={isOpen}
          isDragging={isOpen ? false : isDragging}
          isTucked={isTucked}
          isHovered={isPointerNear || isFocused}
          isRunning={isRunning}
        />
      </Button>
    )
  }
)
