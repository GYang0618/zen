import { useState } from 'react'

const OVERLAY_CONTENT_SELECTOR = [
  '[data-slot="sheet-content"]',
  '[data-slot="dialog-content"]',
  '[data-slot="alert-dialog-content"]',
  '[data-slot="popover-content"]'
].join(',')

/**
 * Radix 的模态弹层打开时会把 `document.body` 的 pointer-events 置为 none，只给自身内容放开，
 * 因此挂载到 body 上的 Base UI 弹层（Combobox 等）会无法点击与滚动。
 * 该 hook 依据传入的锚点元素向上查找最近的 Radix 弹层内容节点作为 portal 容器；
 * 不在弹层内时返回 undefined，走默认的 body 挂载。
 *
 * @example
 * const [setAnchor, container] = useOverlayPortalContainer()
 * <ComboboxInput ref={setAnchor} />
 * <ComboboxContent container={container} />
 */
export function useOverlayPortalContainer<T extends HTMLElement>() {
  const [anchor, setAnchor] = useState<T | null>(null)
  const container = anchor?.closest<HTMLElement>(OVERLAY_CONTENT_SELECTOR) ?? undefined

  return [setAnchor, container] as const
}
