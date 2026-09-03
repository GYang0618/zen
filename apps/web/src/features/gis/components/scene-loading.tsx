import { cn } from '@zen/ui'
import { Globe } from 'lucide-react'
import { useEffect, useState } from 'react'

const FADE_MS = 300

type SceneLoadingProps = {
  active: boolean
}

export function SceneLoading({ active }: SceneLoadingProps) {
  const [mounted, setMounted] = useState(active)

  useEffect(() => {
    if (active) {
      setMounted(true)
      return
    }

    const timeoutId = window.setTimeout(() => setMounted(false), FADE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [active])

  if (!mounted) return null

  return (
    <div
      aria-busy={active}
      aria-live="polite"
      className={cn(
        'absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-md transition-opacity duration-300',
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      role="status"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex size-24 items-center justify-center">
          <span className="absolute size-28 rounded-full bg-primary/10 blur-2xl" />
          <span className="absolute inset-0 rounded-full border border-border/80" />
          <span className="absolute inset-0 animate-[spin_1.2s_linear_infinite] rounded-full border-2 border-transparent border-t-primary border-l-primary/40" />
          <span className="absolute inset-3 animate-[spin_3.2s_linear_infinite_reverse] rounded-full border border-dashed border-muted-foreground/35" />
          <Globe aria-hidden className="relative size-8 text-foreground/80" strokeWidth={1.25} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-medium tracking-tight">场景加载中</p>
          <p className="text-xs text-muted-foreground">正在初始化三维地球</p>
        </div>

        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
