import { CopilotChat as CopilotkitChat } from '@copilotkit/react-core/v2'

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
    <CopilotkitChat
      labels={{
        modalHeaderTitle: 'AI 助手',
        chatInputPlaceholder: '输入你想问的任务问题',
        welcomeMessageText: '你好！有什么我可以帮你的吗？',
        chatDisclaimerText: 'AI可能会出错，请核实重要信息。'
      }}
    />
  )
}
