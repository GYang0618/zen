import { CopilotPopup as CopilotkitPopup } from '@copilotkit/react-core/v2'

import { CopilotRuntimeProvider } from './components/copilot-runtime-provider'
import { useCopilotPopupGenerativeUIComponents } from './generative-ui'
import { useCopilotPopupTools } from './tools'

export function CopilotPopup() {
  return (
    <CopilotRuntimeProvider>
      <PopupRegistry />
      <PopupChat />
    </CopilotRuntimeProvider>
  )
}

function PopupRegistry() {
  useCopilotPopupTools()
  useCopilotPopupGenerativeUIComponents()
  return null
}

function PopupChat() {
  return (
    <CopilotkitPopup
      defaultOpen={false}
      labels={{
        modalHeaderTitle: 'AI 助手',
        chatInputPlaceholder: '输入你想问的任务问题',
        welcomeMessageText: '你好！有什么我可以帮你的吗？',
        chatDisclaimerText: 'AI可能会出错，请核实重要信息。'
      }}
    />
  )
}
