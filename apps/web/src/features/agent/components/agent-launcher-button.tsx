import { useCopilotChatConfiguration } from '@copilotkit/react-core/v2'
import { useLocation } from '@tanstack/react-router'
import { Button, ContextMenu, ContextMenuTrigger, cn } from '@zen/ui'
import { forwardRef, useCallback, useEffect, useState } from 'react'

import { useAgentPopupDock } from '../hooks/use-agent-popup-dock'
import { useBodyPointerBlocked } from '../hooks/use-body-pointer-blocked'
import { useEdgeDock } from '../hooks/use-edge-dock'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { useAgentPetStore } from '../stores/agent-pet-store'
import { AgentPet } from './agent-pet'
import { AgentPetContextMenu } from './agent-pet-context-menu'

import type { CopilotChatToggleButtonProps } from '@copilotkit/react-core/v2'
import type { MouseEventHandler } from 'react'
import type { DockSide } from '../hooks/use-edge-dock'

/** 悬浮球直径，与 size-16 保持一致 */
const LAUNCHER_SIZE = 64
const EDGE_MARGIN = 24
const POSITION_STORAGE_KEY = 'zen.agent.launcher-position'
/** 吸附隐藏时藏到视口外的比例 */
const TUCK_HIDDEN_RATIO = 0.55
/** 吸附隐藏时的水平/垂直位移（px）：先跨过边距，再把大半个球藏到视口外 */
const TUCK_SHIFT = EDGE_MARGIN + LAUNCHER_SIZE * TUCK_HIDDEN_RATIO
/** 首次进入页面时完整展示的时长（ms），之后才开始自动吸附隐藏 */
const INITIAL_REVEAL_DURATION = 2000
/** 唤醒热区在球体外扩展的距离（px） */
const HOT_ZONE_PADDING = 8

function getTuckTransform(side: DockSide) {
  switch (side) {
    case 'left':
      return `translateX(-${TUCK_SHIFT}px)`
    case 'right':
      return `translateX(${TUCK_SHIFT}px)`
    case 'top':
      return `translateY(-${TUCK_SHIFT}px)`
    case 'bottom':
      return `translateY(${TUCK_SHIFT}px)`
  }
}

type AgentLauncherButtonProps = Omit<CopilotChatToggleButtonProps, 'openIcon' | 'closeIcon'>

/**
 * 可拖拽的 Agent 悬浮球：
 * 松手后自动吸附到最近的视口四向边缘（上下左右），空闲时半隐藏。
 * 指针悬停、键盘聚焦或会话打开时恢复完整显示。
 * 右键唤出设置菜单，可自由配置宠物形态、眼型、表情模式以及各交互场景专属表情。
 */
export const AgentLauncherButton = forwardRef<HTMLButtonElement, AgentLauncherButtonProps>(
  function AgentLauncherButton({ className, onClick, ...props }, ref) {
    const { 'data-copilotkit': _copilotkit, ...buttonProps } = props as Record<string, unknown>
    const configuration = useCopilotChatConfiguration()
    const isInert = useBodyPointerBlocked()
    const location = useLocation()
    const isOnPetSettingsPage = location.pathname.startsWith('/settings/pet')
    const changeSignal = useAgentPetStore((state) => state.changeSignal)
    const [isRecentlyChanged, setIsRecentlyChanged] = useState(false)
    const [isPointerNear, setIsPointerNear] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [canTuck, setCanTuck] = useState(false)
    const [squishSignal, setSquishSignal] = useState(0)
    const [windowSize, setWindowSize] = useState(() => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 1200,
      height: typeof window !== 'undefined' ? window.innerHeight : 800
    }))

    // 每次宠物配置发生变更时，唤醒悬浮球并保持 4 秒苏醒，不贴边休眠
    useEffect(() => {
      if (changeSignal === 0) return
      setIsRecentlyChanged(true)
      const timer = setTimeout(() => {
        setIsRecentlyChanged(false)
      }, 4000)
      return () => clearTimeout(timer)
    }, [changeSignal])

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

    const isDesktop = windowSize.width >= 768
    const effectivePosition = isDesktop
      ? position
      : isOpen
        ? {
            x: windowSize.width - LAUNCHER_SIZE - 16,
            y: 16
          }
        : position

    // 动态计算 Copilot 弹窗在屏幕中的停靠坐标与展开形变原点
    useAgentPopupDock({
      position,
      side,
      windowSize,
      launcherSize: LAUNCHER_SIZE,
      edgeMargin: EDGE_MARGIN
    })

    const isInHotZone = useCallback(
      (clientX: number, clientY: number) => {
        if (isOpen) return false

        if (side === 'left') {
          const withinY =
            clientY >= position.y - HOT_ZONE_PADDING &&
            clientY <= position.y + LAUNCHER_SIZE + HOT_ZONE_PADDING
          return withinY && clientX <= position.x + LAUNCHER_SIZE + HOT_ZONE_PADDING
        }
        if (side === 'right') {
          const withinY =
            clientY >= position.y - HOT_ZONE_PADDING &&
            clientY <= position.y + LAUNCHER_SIZE + HOT_ZONE_PADDING
          return withinY && clientX >= position.x - HOT_ZONE_PADDING
        }
        if (side === 'top') {
          const withinX =
            clientX >= position.x - HOT_ZONE_PADDING &&
            clientX <= position.x + LAUNCHER_SIZE + HOT_ZONE_PADDING
          return withinX && clientY <= position.y + LAUNCHER_SIZE + HOT_ZONE_PADDING
        }
        // side === 'bottom'
        const withinX =
          clientX >= position.x - HOT_ZONE_PADDING &&
          clientX <= position.x + LAUNCHER_SIZE + HOT_ZONE_PADDING
        return withinX && clientY >= position.y - HOT_ZONE_PADDING
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

    // 当处于宠物设置页或刚发生配置修改唤醒时，禁止贴边休眠，确保用户所见即所得
    const isTucked =
      canTuck &&
      !isOpen &&
      !isDragging &&
      !isPointerNear &&
      !isFocused &&
      !isOnPetSettingsPage &&
      !isRecentlyChanged

    const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      // 拖拽结束后浏览器仍会补发一次 click，这里丢弃它，避免误开关会话
      if (!isOpen && consumeDragClick()) return

      // 触发如同宠物中心的 Q 弹如果冻的点击动效
      setSquishSignal((c) => c + 1)
      configuration?.setModalOpen(!isOpen)
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <Button
              {...buttonProps}
              ref={ref}
              type="button"
              variant="ghost"
              data-slot="chat-toggle-button"
              data-state={isOpen ? 'open' : 'closed'}
              aria-label={isOpen ? '关闭 AI 助手' : '打开 AI 助手'}
              aria-pressed={isOpen}
              className={cn(
                'fixed z-1300 size-16 p-0 touch-none rounded-full bg-transparent! hover:bg-transparent! active:bg-transparent! dark:hover:bg-transparent! dark:active:bg-transparent! focus-visible:ring-0! border-0! shadow-none! outline-none transition-[left,top,transform,opacity] duration-300 ease-out [&_svg]:size-full!',
                isOpen
                  ? 'cursor-pointer'
                  : isDragging
                    ? 'cursor-grabbing duration-0'
                    : 'cursor-grab',
                isTucked && 'opacity-70',
                isInert && 'pointer-events-none opacity-0',
                className
              )}
              style={{
                left: effectivePosition.x,
                top: effectivePosition.y,
                transform: isTucked ? getTuckTransform(side) : undefined
              }}
              onClick={handleClick}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...(isOpen ? {} : dragHandlers)}
            />
          }
        >
          <AgentPet
            isOpen={isOpen}
            isDragging={isOpen ? false : isDragging}
            isTucked={isTucked}
            isHovered={isPointerNear || isFocused}
            isRunning={isRunning}
            squishSignal={squishSignal}
          />
        </ContextMenuTrigger>

        {/* 右键上下文菜单 */}
        <AgentPetContextMenu />
      </ContextMenu>
    )
  }
)
