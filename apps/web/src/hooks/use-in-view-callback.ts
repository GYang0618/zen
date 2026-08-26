import { useEffect, useRef } from 'react'

type UseInViewCallbackOptions = {
  enabled?: boolean
  rootMargin?: string
}

export function useInViewCallback(
  callback: () => void,
  { enabled = true, rootMargin = '160px' }: UseInViewCallbackOptions = {}
) {
  const ref = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current()
        }
      },
      { root: null, rootMargin, threshold: 0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return ref
}
