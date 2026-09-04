import { cn, Skeleton } from '@zen/ui'

const BUBBLES = [
  { align: 'end' as const, className: 'h-16 w-3/5 max-w-md' },
  { align: 'start' as const, className: 'h-24 w-4/5 max-w-lg' },
  { align: 'end' as const, className: 'h-12 w-2/5 max-w-sm' },
  { align: 'start' as const, className: 'h-28 w-3/4 max-w-xl' }
]

export function ChatThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">正在加载对话</span>
      {BUBBLES.map((bubble) => (
        <div
          key={bubble.className}
          className={bubble.align === 'end' ? 'flex justify-end' : 'flex justify-start'}
        >
          <Skeleton className={cn('rounded-2xl', bubble.className)} />
        </div>
      ))}
    </div>
  )
}
