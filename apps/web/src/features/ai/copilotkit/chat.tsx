import { CopilotChat as CopilotkitChat } from '@copilotkit/react-core/v2'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'

import ChatConversation from './components/chat-conversation'
import { CopilotRuntimeProvider } from './components/copilot-runtime-provider'
import { useCopilotChatGenerativeUIComponents } from './generative-ui'
import { useCopilotChatTools } from './tools'

export function CopilotChat() {
  return (
    <CopilotRuntimeProvider>
      <ChatRegistry />
      <Chat />
    </CopilotRuntimeProvider>
  )
}

function ChatRegistry() {
  useCopilotChatTools()
  useCopilotChatGenerativeUIComponents()
  return null
}

function Chat() {
  // 使用其他渲染、actions等工具

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed fluid className="flex flex-1 flex-col gap-4 sm:gap-6 p-0 ">
        <ChatConversation />

        {/* <CopilotkitChat
          labels={{
            modalHeaderTitle: 'AI 助手',
            chatInputPlaceholder: '输入你想问的任务问题',
            welcomeMessageText: '你好！有什么我可以帮你的吗？',
            chatDisclaimerText: 'AI可能会出错，请核实重要信息。'
          }}
        /> */}
      </Main>
    </>
  )
}
