import { useEffect, useState } from 'react'

/**
 * 监听 body 是否被模态层禁用了指针事件。
 *
 * Radix 的 Dialog / Sheet / AlertDialog 等模态组件打开时，会给 `document.body`
 * 设置 `pointer-events: none`，仅对弹层内容单独恢复。此时页面上的悬浮控件虽然
 * 可见却完全无法交互，应当据此一并隐藏。
 */
export function useBodyPointerBlocked() {
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const syncState = () => setIsBlocked(document.body.style.pointerEvents === 'none')

    syncState()
    const observer = new MutationObserver(syncState)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  return isBlocked
}
