import { CopilotPopup as CopilotkitPopup, useConfigureSuggestions } from '@copilotkit/react-core/v2'

import { PopupChatRegistrations } from './components/registrations'

export function CopilotPopup() {
  useConfigureSuggestions({
    instructions:
      '你是一个AI助手，请根据用户的问题和生成的答案，生成建议，建议需要简洁明了，不要过于复杂',
    minSuggestions: 2,
    maxSuggestions: 3,
    available: 'always'
  })
  return (
    <>
      <PopupChatRegistrations />
      <CopilotkitPopup
        agentId="plan"
        defaultOpen={false}
        labels={{
          modalHeaderTitle: 'AI 助手',
          chatInputPlaceholder: '输入你想问的任务问题',
          welcomeMessageText: '你好！有什么我可以帮你的吗？',
          chatDisclaimerText: 'AI可能会出错，请核实重要信息。'
        }}
      />
    </>
  )
}
