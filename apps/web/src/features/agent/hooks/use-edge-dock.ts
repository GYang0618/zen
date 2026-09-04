import { useCallback, useEffect, useRef, useState } from 'react'

import type { PointerEvent as ReactPointerEvent } from 'react'

export type DockSide = 'left' | 'right'

interface DockState {
  x: number
  y: number
  side: DockSide
}

interface DragSession {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

interface UseEdgeDockOptions {
  /** 被拖拽元素的边长（px），用于边界计算 */
  size: number
  /** 元素与视口边缘的安全距离（px） */
  margin?: number
  /** localStorage 持久化 key，不传则不持久化 */
  storageKey?: string
}

interface UseEdgeDockResult {
  position: { x: number; y: number }
  side: DockSide
  isDragging: boolean
  /** 读取并重置「本次交互是否为拖拽」，用于在 click 中丢弃拖拽尾随的点击 */
  consumeDragClick: () => boolean
  dragHandlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
  }
}

const DEFAULT_MARGIN = 24
/** 位移超过该阈值才判定为拖拽，避免误伤点击 */
const DRAG_THRESHOLD = 4

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function readStoredPosition(storageKey?: string) {
  if (!storageKey || typeof window === 'undefined') return undefined

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return undefined

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return undefined

    const { x, y } = parsed as Record<string, unknown>
    if (typeof x !== 'number' || typeof y !== 'number') return undefined

    return { x, y }
  } catch {
    return undefined
  }
}

/** 把任意坐标吸附到最近的左右边缘，并把纵向位置约束在视口内 */
function snapToEdge(x: number, y: number, size: number, margin: number): DockState {
  const maxX = Math.max(margin, window.innerWidth - size - margin)
  const maxY = Math.max(margin, window.innerHeight - size - margin)
  const side: DockSide = x + size / 2 < window.innerWidth / 2 ? 'left' : 'right'

  return { x: side === 'left' ? margin : maxX, y: clamp(y, margin, maxY), side }
}

function createInitialDock(size: number, margin: number, storageKey?: string): DockState {
  if (typeof window === 'undefined') return { x: 0, y: 0, side: 'right' }

  const stored = readStoredPosition(storageKey)
  const x = stored?.x ?? window.innerWidth - size - margin
  const y = stored?.y ?? window.innerHeight - size - margin

  return snapToEdge(x, y, size, margin)
}

/**
 * 让固定定位元素支持指针拖拽，松手后自动吸附到最近的视口边缘。
 * 位置以 `position: fixed` 的 left / top 表达，可选持久化到 localStorage。
 */
export function useEdgeDock({
  size,
  margin = DEFAULT_MARGIN,
  storageKey
}: UseEdgeDockOptions): UseEdgeDockResult {
  const [dock, setDock] = useState<DockState>(() => createInitialDock(size, margin, storageKey))
  const [isDragging, setIsDragging] = useState(false)
  const dockRef = useRef(dock)
  const dragRef = useRef<DragSession | null>(null)
  const draggedRef = useRef(false)

  useEffect(() => {
    dockRef.current = dock
  }, [dock])

  useEffect(() => {
    const handleResize = () => setDock((prev) => snapToEdge(prev.x, prev.y, size, margin))

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [margin, size])

  useEffect(() => {
    if (!storageKey || isDragging) return

    window.localStorage.setItem(storageKey, JSON.stringify({ x: dock.x, y: dock.y }))
  }, [dock, isDragging, storageKey])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: dockRef.current.x,
      originY: dockRef.current.y,
      moved: false
    }
  }, [])

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return

      const deltaX = event.clientX - drag.startX
      const deltaY = event.clientY - drag.startY
      if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return

      if (!drag.moved) {
        drag.moved = true
        setIsDragging(true)
      }

      setDock((prev) => ({
        ...prev,
        x: clamp(drag.originX + deltaX, margin, window.innerWidth - size - margin),
        y: clamp(drag.originY + deltaY, margin, window.innerHeight - size - margin)
      }))
    },
    [margin, size]
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return

      dragRef.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      if (!drag.moved) return

      draggedRef.current = true
      setIsDragging(false)
      setDock((prev) => snapToEdge(prev.x, prev.y, size, margin))
    },
    [margin, size]
  )

  const consumeDragClick = useCallback(() => {
    const dragged = draggedRef.current
    draggedRef.current = false
    return dragged
  }, [])

  return {
    position: { x: dock.x, y: dock.y },
    side: dock.side,
    isDragging,
    consumeDragClick,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag
    }
  }
}
