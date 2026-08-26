import { cn, GradientText } from '@zen/ui'

import { useAuthStore } from '@/stores'

interface ChatGreetingProps {
  className?: string
}

export function ChatGreeting({ className }: ChatGreetingProps) {
  const user = useAuthStore((state) => state.user)
  const displayName = user?.nickname || user?.username
  const title = displayName ? `${displayName}，你好！` : '你好！'

  return (
    <div className={cn('flex justify-center px-4 pb-4', className)}>
      <h1 className="text-center text-4xl font-bold leading-normal">
        <GradientText text={title} />
        <br />
        <GradientText text="有什么可以帮你的吗？" />
      </h1>
    </div>
  )
}
