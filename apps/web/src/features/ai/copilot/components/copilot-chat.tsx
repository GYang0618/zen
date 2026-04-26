import { GradientText } from '@zen/ui'
import { useLayoutEffect, useRef } from 'react'

import { useAuthStore } from '@/stores'

import { useCopilot } from '../copilot-provider'
import { Messages } from './messages'
import { NotionPromptForm } from './notion-prompt-form'

export function CopilotChat() {
  const user = useAuthStore((state) => state.user)
  const { messages, sendMessage, status } = useCopilot()
  const chatRef = useRef<HTMLDivElement>(null)
  const handleSendMessage = async (value: string) => {
    await sendMessage({ text: value })
  }

  useLayoutEffect(() => {
    if (!messages.length) return

    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: status === 'streaming' ? 'auto' : 'smooth'
      })
    }
  }, [messages, status])

  return (
    <div ref={chatRef} className="relative h-full overflow-y-auto">
      <div className="h-full flex flex-col px-4 pt-6 gap-6  @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl ">
        <div className="relative flex-1">
          {messages.length ? (
            messages.map((message) => <Messages key={message.id} {...message} />)
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <span className="text-center text-4xl leading-normal  font-bold">
                <GradientText text={`${user?.nickname || user?.username}，你好！`} />
                <br />
                <GradientText text="有什么可以帮你的吗？" />
              </span>
            </div>
          )}
        </div>

        <div className={'sticky w-full bottom-0 pb-6 bg-background rounded-tl-xl rounded-tr-xl'}>
          <NotionPromptForm onSubmit={handleSendMessage} />
        </div>
      </div>
    </div>
  )
}
