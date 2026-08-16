import { useCopilotChatConfiguration } from '@copilotkit/react-core/v2'
import { Button, cn } from '@zen/ui'
import { Bot, X } from 'lucide-react'
import { forwardRef, useCallback, useEffect, useState } from 'react'

import { useBodyPointerBlocked } from '../hooks/use-body-pointer-blocked'
import { useEdgeDock } from '../hooks/use-edge-dock'

import type { CopilotChatToggleButtonProps } from '@copilotkit/react-core/v2'
import type { MouseEventHandler } from 'react'

/** 悬浮球直径，与 size-14 保持一致 */
const LAUNCHER_SIZE = 56
const EDGE_MARGIN = 24
const POSITION_STORAGE_KEY = 'zen.copilot.launcher-position'
/** 吸附隐藏时藏到视口外的比例 */
const TUCK_HIDDEN_RATIO = 0.55
/** 吸附隐藏时的水平位移（px）：先跨过边距，再把大半个球藏到视口外 */
const TUCK_SHIFT = EDGE_MARGIN + LAUNCHER_SIZE * TUCK_HIDDEN_RATIO
/** 首次进入页面时完整展示的时长（ms），之后才开始自动吸附隐藏 */
const INITIAL_REVEAL_DURATION = 2000
/** 唤醒热区在球体外扩展的距离（px） */
const HOT_ZONE_PADDING = 8

type CopilotLauncherButtonProps = Omit<CopilotChatToggleButtonProps, 'openIcon' | 'closeIcon'>

/**
 * 可拖拽的 Copilot 悬浮球：松手后吸附到最近的视口边缘，
 * 空闲时半隐藏，指针悬停、键盘聚焦或会话打开时恢复完整显示。
 */
export const CopilotLauncherButton = forwardRef<HTMLButtonElement, CopilotLauncherButtonProps>(
  function CopilotLauncherButton({ className, onClick, ...props }, ref) {
    const configuration = useCopilotChatConfiguration()
    const isInert = useBodyPointerBlocked()
    const [isPointerNear, setIsPointerNear] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [canTuck, setCanTuck] = useState(false)
    const { position, side, isDragging, consumeDragClick, dragHandlers } = useEdgeDock({
      size: LAUNCHER_SIZE,
      margin: EDGE_MARGIN,
      storageKey: POSITION_STORAGE_KEY
    })

    /**
     * 热区固定覆盖「收起时露出的部分」到「展开后的整颗球」，并一直延伸到视口边缘。
     * 不能直接用球体的 pointerenter / pointerleave：球滑出后会离开光标，
     * 触发 leave 又收起、再次进入 hover，形成来回抖动。
     */
    const isInHotZone = useCallback(
      (clientX: number, clientY: number) => {
        const withinY =
          clientY >= position.y - HOT_ZONE_PADDING &&
          clientY <= position.y + LAUNCHER_SIZE + HOT_ZONE_PADDING

        if (!withinY) return false

        return side === 'left'
          ? clientX <= position.x + LAUNCHER_SIZE + HOT_ZONE_PADDING
          : clientX >= position.x - HOT_ZONE_PADDING
      },
      [position.x, position.y, side]
    )

    useEffect(() => {
      const handlePointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return

        const next = isInHotZone(event.clientX, event.clientY)
        setIsPointerNear((prev) => (prev === next ? prev : next))
      }

      window.addEventListener('pointermove', handlePointerMove)
      return () => window.removeEventListener('pointermove', handlePointerMove)
    }, [isInHotZone])

    useEffect(() => {
      const timer = setTimeout(() => setCanTuck(true), INITIAL_REVEAL_DURATION)
      return () => clearTimeout(timer)
    }, [])

    const isOpen = configuration?.isModalOpen ?? false
    const isTucked = canTuck && !isOpen && !isDragging && !isPointerNear && !isFocused

    const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      // 拖拽结束后浏览器仍会补发一次 click，这里丢弃它，避免误开关会话
      if (consumeDragClick()) return

      configuration?.setModalOpen(!isOpen)
    }

    return (
      <Button
        {...props}
        ref={ref}
        type="button"
        data-copilotkit
        data-slot="chat-toggle-button"
        data-state={isOpen ? 'open' : 'closed'}
        aria-label={isOpen ? '关闭 AI 助手' : '打开 AI 助手'}
        aria-pressed={isOpen}
        className={cn(
          'fixed z-1100 size-14 touch-none rounded-full shadow-lg transition-[left,top,transform,opacity] duration-300 ease-out hover:shadow-xl',
          // 拖拽跟手：实时更新的 left / top 不能有过渡；松手后再用过渡播放吸附动画
          isDragging ? 'cursor-grabbing duration-0' : 'cursor-grab',
          isTucked && 'opacity-70',
          // 模态层已屏蔽外部交互，此时球不可用，淡出避免造成可点击的错觉
          isInert && 'pointer-events-none opacity-0',
          className
        )}
        style={{
          left: position.x,
          top: position.y,
          transform: isTucked
            ? `translateX(${side === 'left' ? -TUCK_SHIFT : TUCK_SHIFT}px)`
            : undefined
        }}
        onClick={handleClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...dragHandlers}
      >
        {isOpen ? <X className="size-6" /> : <Bot className="size-6" strokeWidth={1.75} />}
      </Button>
    )
  }
)
