import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@zen/ui/lib/utils'
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

import type { ReactVirtualizer, ScrollToOptions } from '@tanstack/react-virtual'
import type * as React from 'react'

const DEFAULT_OVERSCAN = 8
const DEFAULT_END_REACHED_THRESHOLD = 8

type VirtualListOrientation = 'vertical' | 'horizontal'
type VirtualListAnchor = 'start' | 'end'
type VirtualListFollowOnAppend = boolean | 'auto' | 'smooth' | 'instant'
type VirtualListScroll = 'self' | 'window'
type VirtualListVirtualizer =
  | ReactVirtualizer<HTMLDivElement, Element>
  | ReactVirtualizer<Window, Element>

export interface VirtualListHandle {
  scrollToIndex: (index: number, options?: ScrollToOptions) => void
  scrollToOffset: (offset: number, options?: ScrollToOptions) => void
  scrollToEnd: (options?: Pick<ScrollToOptions, 'behavior'>) => void
  getScrollElement: () => HTMLDivElement | Window | null
  getVirtualizer: () => VirtualListVirtualizer
}

export interface VirtualListItemContext {
  index: number
  start: number
  size: number
  lane: number
}

export type VirtualListProps<T> = Omit<React.ComponentProps<'div'>, 'children' | 'ref'> & {
  ref?: React.Ref<VirtualListHandle>
  /** 完整数据源。DOM 只会渲染可视区域附近的项。 */
  items: readonly T[]
  /** 主轴预估尺寸（px）。动态测高时请估偏大，滚动会更稳。 */
  estimateSize: number | ((index: number, item: T) => number)
  children: (item: T, context: VirtualListItemContext) => React.ReactNode
  getItemKey?: (item: T, index: number) => React.Key
  orientation?: VirtualListOrientation
  /** 列数（纵向）或行数（横向），大于 1 时为网格 / 瀑布流。设置 `minLaneSize` 后由容器自动计算。 */
  lanes?: number
  /**
   * 交叉轴单项最小尺寸（px）。传入后按容器宽度（纵向）或高度（横向）自动分列，
   * 等价于 CSS `repeat(auto-fill, minmax(minLaneSize, 1fr))`。
   */
  minLaneSize?: number
  gap?: number
  /** 额外渲染量。单列按项计；多列按行计（内部会乘以列数）。 */
  overscan?: number
  paddingStart?: number
  paddingEnd?: number
  /** 为 false 时使用 estimateSize 作为固定主轴尺寸，不再 ResizeObserver 测高。 */
  measure?: boolean
  empty?: React.ReactNode
  onEndReached?: () => void
  endReachedThreshold?: number
  initialOffset?: number
  /** 聊天 / 日志场景用 `end`，并配合 `followOnAppend` 自动贴底。 */
  anchor?: VirtualListAnchor
  followOnAppend?: VirtualListFollowOnAppend
  enabled?: boolean
  /**
   * 滚动容器。
   * - `self`（默认）：列表自身滚动，父级必须给出确定高度（如 `h-96` 或 `flex-1 min-h-0`）。
   * - `window`：跟随页面滚动，滚动条出现在窗口右侧。
   */
  scroll?: VirtualListScroll
}

function resolveEstimateSize<T>(
  estimateSize: VirtualListProps<T>['estimateSize'],
  items: readonly T[],
  index: number
) {
  if (typeof estimateSize === 'number') return estimateSize
  const item = items[index]
  if (item === undefined) return 0
  return estimateSize(index, item)
}

function resolveItemKey<T>(
  getItemKey: VirtualListProps<T>['getItemKey'],
  items: readonly T[],
  index: number
) {
  const item = items[index]
  if (item === undefined || getItemKey == null) return index
  return getItemKey(item, index)
}

function getCrossAxisStyle(
  orientation: VirtualListOrientation,
  lanes: number,
  lane: number,
  gap: number
): React.CSSProperties {
  const isVertical = orientation === 'vertical'

  if (lanes <= 1) {
    return isVertical ? { width: '100%' } : { height: '100%' }
  }

  const size = gap > 0 ? `calc((100% - ${(lanes - 1) * gap}px) / ${lanes})` : `${100 / lanes}%`
  const offset = gap > 0 ? `calc(${lane} * (${size} + ${gap}px))` : `${(lane * 100) / lanes}%`

  return isVertical ? { width: size, left: offset } : { height: size, top: offset }
}

function getVirtualItemStyle(options: {
  orientation: VirtualListOrientation
  lanes: number
  gap: number
  start: number
  size: number
  lane: number
  measure: boolean
  scrollMargin: number
}): React.CSSProperties {
  const { orientation, lanes, gap, start, size, lane, measure, scrollMargin } = options
  const isVertical = orientation === 'vertical'
  const offset = start - scrollMargin

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: isVertical ? `translateY(${offset}px)` : `translateX(${offset}px)`,
    ...(measure ? undefined : isVertical ? { height: size } : { width: size }),
    ...getCrossAxisStyle(orientation, lanes, lane, gap)
  }
}

function getAutoLaneCount(crossAxisSize: number, minLaneSize: number, gap: number) {
  return Math.max(1, Math.floor((crossAxisSize + gap) / (minLaneSize + gap)))
}

function useAutoLanes(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  minLaneSize: number | undefined,
  gap: number,
  orientation: VirtualListOrientation,
  fallbackLanes: number
) {
  const [autoLanes, setAutoLanes] = useState(fallbackLanes)

  useLayoutEffect(() => {
    if (minLaneSize == null) return
    const element = scrollRef.current
    if (!element) return

    const updateLanes = () => {
      const crossAxisSize =
        orientation === 'horizontal' ? element.clientHeight : element.clientWidth
      const nextLanes = getAutoLaneCount(crossAxisSize, minLaneSize, gap)
      setAutoLanes((current) => (current === nextLanes ? current : nextLanes))
    }

    updateLanes()
    const observer = new ResizeObserver(updateLanes)
    observer.observe(element)
    return () => observer.disconnect()
  }, [gap, minLaneSize, orientation, scrollRef])

  return minLaneSize == null ? fallbackLanes : autoLanes
}

function getWindowScrollMargin(element: HTMLElement, orientation: VirtualListOrientation) {
  const rect = element.getBoundingClientRect()
  return orientation === 'horizontal' ? rect.left + window.scrollX : rect.top + window.scrollY
}

function useWindowScrollMargin(
  elementRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  orientation: VirtualListOrientation
) {
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    if (!enabled) return
    const element = elementRef.current
    if (!element) return

    const update = () => {
      const next = getWindowScrollMargin(element, orientation)
      setScrollMargin((current) => (current === next ? current : next))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [elementRef, enabled, orientation])

  return enabled ? scrollMargin : 0
}

function useEndReached(
  lastVisibleIndex: number | undefined,
  itemCount: number,
  threshold: number,
  onEndReached: (() => void) | undefined,
  enabled: boolean
) {
  const firedAtCountRef = useRef(0)

  useEffect(() => {
    if (!enabled || onEndReached == null || lastVisibleIndex == null || itemCount === 0) {
      return
    }

    if (itemCount < firedAtCountRef.current) {
      firedAtCountRef.current = 0
    }

    if (lastVisibleIndex < itemCount - threshold) return
    if (firedAtCountRef.current === itemCount) return

    firedAtCountRef.current = itemCount
    onEndReached()
  }, [enabled, itemCount, lastVisibleIndex, onEndReached, threshold])
}

/**
 * 通用虚拟列表。
 *
 * - `scroll="self"`（默认）：父级必须给出确定高度（如 `h-96` 或 `flex-1 min-h-0`），
 *   否则可视区域等于内容高度，虚拟化不会生效。
 * - `scroll="window"`：跟随页面滚动，适合整页列表。
 *
 * @example
 * ```tsx
 * <VirtualList items={users} estimateSize={56} getItemKey={(user) => user.id} className="h-96">
 *   {(user) => <div>{user.name}</div>}
 * </VirtualList>
 * ```
 */
function VirtualList<T>({
  ref,
  items,
  estimateSize,
  getItemKey,
  children,
  empty,
  className,
  orientation = 'vertical',
  lanes = 1,
  minLaneSize,
  gap = 0,
  overscan = DEFAULT_OVERSCAN,
  paddingStart,
  paddingEnd,
  measure = true,
  onEndReached,
  endReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
  initialOffset,
  anchor = 'start',
  followOnAppend,
  enabled = true,
  scroll = 'self',
  ...props
}: VirtualListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const isHorizontal = orientation === 'horizontal'
  const isWindowScroll = scroll === 'window'
  const resolvedLanes = useAutoLanes(listRef, minLaneSize, gap, orientation, lanes)
  const scrollMargin = useWindowScrollMargin(listRef, isWindowScroll, orientation)

  const sharedOptions = {
    count: items.length,
    estimateSize: (index: number) => resolveEstimateSize(estimateSize, items, index),
    getItemKey: (index: number) => resolveItemKey(getItemKey, items, index),
    horizontal: isHorizontal,
    lanes: resolvedLanes,
    gap,
    overscan: overscan * resolvedLanes,
    paddingStart,
    paddingEnd,
    initialOffset,
    anchorTo: anchor,
    followOnAppend,
    useFlushSync: false as const
  }

  const selfVirtualizer = useVirtualizer({
    ...sharedOptions,
    enabled: enabled && !isWindowScroll,
    getScrollElement: () => listRef.current
  })

  const windowVirtualizer = useWindowVirtualizer({
    ...sharedOptions,
    enabled: enabled && isWindowScroll,
    scrollMargin
  })

  const virtualizer = isWindowScroll ? windowVirtualizer : selfVirtualizer

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index, options) => virtualizer.scrollToIndex(index, options),
    scrollToOffset: (offset, options) => virtualizer.scrollToOffset(offset, options),
    scrollToEnd: (options) => virtualizer.scrollToEnd(options),
    getScrollElement: () => (isWindowScroll ? window : listRef.current),
    getVirtualizer: () => virtualizer
  }))

  const virtualItems = virtualizer.getVirtualItems()
  const lastVisibleIndex = virtualItems.at(-1)?.index
  const isEmpty = items.length === 0

  useEndReached(lastVisibleIndex, items.length, endReachedThreshold, onEndReached, enabled)

  return (
    <div
      ref={listRef}
      data-slot="virtual-list"
      data-orientation={orientation}
      data-scroll={scroll}
      className={cn(
        'relative outline-none',
        !isWindowScroll && 'min-h-0 overflow-auto overscroll-contain',
        isEmpty && 'flex flex-col',
        className
      )}
      {...props}
    >
      {isEmpty ? (
        <div
          data-slot="virtual-list-empty"
          className="flex min-h-full flex-1 flex-col items-center justify-center"
        >
          {empty}
        </div>
      ) : (
        <div
          data-slot="virtual-list-content"
          role="list"
          className="relative"
          style={
            isHorizontal
              ? { height: '100%', width: virtualizer.getTotalSize() }
              : { width: '100%', height: virtualizer.getTotalSize() }
          }
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index]
            if (item === undefined) return null

            return (
              <div
                key={virtualItem.key}
                role="listitem"
                data-slot="virtual-list-item"
                data-index={virtualItem.index}
                ref={measure ? virtualizer.measureElement : undefined}
                aria-setsize={items.length}
                aria-posinset={virtualItem.index + 1}
                style={getVirtualItemStyle({
                  orientation,
                  lanes: resolvedLanes,
                  gap,
                  start: virtualItem.start,
                  size: virtualItem.size,
                  lane: virtualItem.lane,
                  measure,
                  scrollMargin: isWindowScroll ? virtualizer.options.scrollMargin : 0
                })}
              >
                {children(item, {
                  index: virtualItem.index,
                  start: virtualItem.start,
                  size: virtualItem.size,
                  lane: virtualItem.lane
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { VirtualList }
