import { cn, GradientText } from '@zen/ui'

import { useAuthStore } from '@/stores'

import { GreetingPet } from './greeting-pet'

interface ChatGreetingProps {
  className?: string
  threadId?: string
  showPet?: boolean
}

export function ChatGreeting({ className, threadId, showPet = true }: ChatGreetingProps) {
  const user = useAuthStore((state) => state.user)
  const displayName = user?.nickname || user?.username
  const title = displayName ? `${displayName}，你好！` : '你好！'

  return (
    <div
      className={cn(
        '@container flex w-full flex-col items-center justify-center px-4 pb-4 select-none',
        className
      )}
    >
      {showPet && (
        <div className="mb-4 @xs:mb-3">
          <GreetingPet threadId={threadId} />
        </div>
      )}
      <h1 className="text-center font-bold leading-normal text-2xl @xl:text-3xl @3xl:text-4xl">
        <GradientText text={title} />
        <br />
        <GradientText text="有什么可以帮你的吗？" />
      </h1>
    </div>
  )
}
