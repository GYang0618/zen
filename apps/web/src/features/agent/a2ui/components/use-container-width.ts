import { useLayoutEffect, useRef, useState } from 'react'

/** 读取元素内容盒宽度。布局断点以此为准，不读取视口。 */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      setWidth(element.clientWidth)
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, width }
}
