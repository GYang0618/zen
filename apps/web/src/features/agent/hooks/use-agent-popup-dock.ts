import { useEffect } from 'react'

import type { DockSide } from './use-edge-dock'

interface UseAgentPopupDockOptions {
  position: { x: number; y: number }
  side: DockSide
  windowSize: { width: number; height: number }
  launcherSize?: number
  edgeMargin?: number
  popupWidth?: number
}

const DEFAULT_LAUNCHER_SIZE = 64
const DEFAULT_EDGE_MARGIN = 24
const DEFAULT_POPUP_WIDTH = 440
const POPUP_GAP = 12
const MIN_POPUP_MAX_HEIGHT = 280

/**
 * 动态计算 Copilot 弹窗在屏幕中的停靠坐标与形变原点 CSS 变量，
 * 确保弹窗智能跟随小宠物（自适应左、右、上、下四向边缘与可用空间）。
 */
export function useAgentPopupDock({
  position,
  side,
  windowSize,
  launcherSize = DEFAULT_LAUNCHER_SIZE,
  edgeMargin = DEFAULT_EDGE_MARGIN,
  popupWidth = DEFAULT_POPUP_WIDTH
}: UseAgentPopupDockOptions) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement

    if (side === 'left') {
      root.style.setProperty('--agent-popup-left', `${edgeMargin}px`)
      root.style.setProperty('--agent-popup-right', 'auto')
      root.style.setProperty('--agent-popup-align', 'flex-start')

      const spaceAbove = position.y - edgeMargin
      const spaceBelow = windowSize.height - (position.y + launcherSize) - edgeMargin

      if (spaceAbove >= spaceBelow) {
        const popupBottom = windowSize.height - position.y + POPUP_GAP
        const maxHeight = windowSize.height - popupBottom - edgeMargin
        root.style.setProperty('--agent-popup-top', 'auto')
        root.style.setProperty('--agent-popup-bottom', `${popupBottom}px`)
        root.style.setProperty(
          '--agent-popup-max-height',
          `${Math.max(MIN_POPUP_MAX_HEIGHT, maxHeight)}px`
        )
        root.style.setProperty('--agent-popup-origin', 'bottom left')
      } else {
        const popupTop = position.y + launcherSize + POPUP_GAP
        const maxHeight = windowSize.height - popupTop - edgeMargin
        root.style.setProperty('--agent-popup-top', `${popupTop}px`)
        root.style.setProperty('--agent-popup-bottom', 'auto')
        root.style.setProperty(
          '--agent-popup-max-height',
          `${Math.max(MIN_POPUP_MAX_HEIGHT, maxHeight)}px`
        )
        root.style.setProperty('--agent-popup-origin', 'top left')
      }
    } else if (side === 'right') {
      root.style.setProperty('--agent-popup-left', 'auto')
      root.style.setProperty('--agent-popup-right', `${edgeMargin}px`)
      root.style.setProperty('--agent-popup-align', 'flex-end')

      const spaceAbove = position.y - edgeMargin
      const spaceBelow = windowSize.height - (position.y + launcherSize) - edgeMargin

      if (spaceAbove >= spaceBelow) {
        const popupBottom = windowSize.height - position.y + POPUP_GAP
        const maxHeight = windowSize.height - popupBottom - edgeMargin
        root.style.setProperty('--agent-popup-top', 'auto')
        root.style.setProperty('--agent-popup-bottom', `${popupBottom}px`)
        root.style.setProperty(
          '--agent-popup-max-height',
          `${Math.max(MIN_POPUP_MAX_HEIGHT, maxHeight)}px`
        )
        root.style.setProperty('--agent-popup-origin', 'bottom right')
      } else {
        const popupTop = position.y + launcherSize + POPUP_GAP
        const maxHeight = windowSize.height - popupTop - edgeMargin
        root.style.setProperty('--agent-popup-top', `${popupTop}px`)
        root.style.setProperty('--agent-popup-bottom', 'auto')
        root.style.setProperty(
          '--agent-popup-max-height',
          `${Math.max(MIN_POPUP_MAX_HEIGHT, maxHeight)}px`
        )
        root.style.setProperty('--agent-popup-origin', 'top right')
      }
    } else if (side === 'top') {
      // 吸附在顶部边缘：向下展开
      const popupTop = position.y + launcherSize + POPUP_GAP
      const maxHeight = windowSize.height - popupTop - edgeMargin
      root.style.setProperty('--agent-popup-top', `${popupTop}px`)
      root.style.setProperty('--agent-popup-bottom', 'auto')
      root.style.setProperty(
        '--agent-popup-max-height',
        `${Math.max(MIN_POPUP_MAX_HEIGHT, maxHeight)}px`
      )

      if (position.x + popupWidth > windowSize.width - edgeMargin) {
        root.style.setProperty('--agent-popup-left', 'auto')
        root.style.setProperty('--agent-popup-right', `${edgeMargin}px`)
        root.style.setProperty('--agent-popup-align', 'flex-end')
        root.style.setProperty('--agent-popup-origin', 'top right')
      } else if (position.x < edgeMargin + 60) {
        root.style.setProperty('--agent-popup-left', `${edgeMargin}px`)
        root.style.setProperty('--agent-popup-right', 'auto')
        root.style.setProperty('--agent-popup-align', 'flex-start')
        root.style.setProperty('--agent-popup-origin', 'top left')
      } else {
        const left = Math.min(
          Math.max(edgeMargin, position.x + launcherSize / 2 - popupWidth / 2),
          windowSize.width - popupWidth - edgeMargin
        )
        root.style.setProperty('--agent-popup-left', `${left}px`)
        root.style.setProperty('--agent-popup-right', 'auto')
        root.style.setProperty('--agent-popup-align', 'flex-start')
        root.style.setProperty('--agent-popup-origin', 'top center')
      }
    } else {
      // side === 'bottom'：吸附在底部边缘，向上展开
      const popupBottom = windowSize.height - position.y + POPUP_GAP
      const maxHeight = windowSize.height - popupBottom - edgeMargin
      root.style.setProperty('--agent-popup-top', 'auto')
      root.style.setProperty('--agent-popup-bottom', `${popupBottom}px`)
      root.style.setProperty(
        '--agent-popup-max-height',
        `${Math.max(MIN_POPUP_MAX_HEIGHT, maxHeight)}px`
      )

      if (position.x + popupWidth > windowSize.width - edgeMargin) {
        root.style.setProperty('--agent-popup-left', 'auto')
        root.style.setProperty('--agent-popup-right', `${edgeMargin}px`)
        root.style.setProperty('--agent-popup-align', 'flex-end')
        root.style.setProperty('--agent-popup-origin', 'bottom right')
      } else if (position.x < edgeMargin + 60) {
        root.style.setProperty('--agent-popup-left', `${edgeMargin}px`)
        root.style.setProperty('--agent-popup-right', 'auto')
        root.style.setProperty('--agent-popup-align', 'flex-start')
        root.style.setProperty('--agent-popup-origin', 'bottom left')
      } else {
        const left = Math.min(
          Math.max(edgeMargin, position.x + launcherSize / 2 - popupWidth / 2),
          windowSize.width - popupWidth - edgeMargin
        )
        root.style.setProperty('--agent-popup-left', `${left}px`)
        root.style.setProperty('--agent-popup-right', 'auto')
        root.style.setProperty('--agent-popup-align', 'flex-start')
        root.style.setProperty('--agent-popup-origin', 'bottom center')
      }
    }

    return () => {
      root.style.removeProperty('--agent-popup-left')
      root.style.removeProperty('--agent-popup-right')
      root.style.removeProperty('--agent-popup-top')
      root.style.removeProperty('--agent-popup-bottom')
      root.style.removeProperty('--agent-popup-max-height')
      root.style.removeProperty('--agent-popup-align')
      root.style.removeProperty('--agent-popup-origin')
    }
  }, [
    edgeMargin,
    launcherSize,
    popupWidth,
    position.x,
    position.y,
    side,
    windowSize.height,
    windowSize.width
  ])
}
