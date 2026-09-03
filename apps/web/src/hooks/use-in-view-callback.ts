import { useEffect, useRef } from 'react'

type UseInViewCallbackOptions = {
  enabled?: boolean
  rootMargin?: string
  root?: Element | Document | null
  rootSelector?: string
}

export function useInViewCallback(
  callback: () => void,
  { enabled = true, rootMargin = '160px', root = null, rootSelector }: UseInViewCallbackOptions = {}
) {
  const ref = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return
    const node = ref.current
    if (!node) return

    const observerRoot = rootSelector ? node.closest(rootSelector) : root

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current()
        }
      },
      { root: observerRoot, rootMargin, threshold: 0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, root, rootMargin, rootSelector])

  return ref
}
