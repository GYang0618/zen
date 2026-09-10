import {
  CopilotPopup as CopilotkitPopup,
  useCopilotChatConfiguration
} from '@copilotkit/react-core/v2'
import { useEffect, useRef } from 'react'

import { AgentLauncherButton } from './components/agent-launcher-button'
import { PopupChatRegistrations } from './components/registrations'

export function AgentPopup() {
  const configuration = useCopilotChatConfiguration()
  const hasInitializedRef = useRef(false)

  // 修复 CopilotKit v2 顶层 Provider 默认 isModalOpen=true 并在子级更新时覆盖 defaultOpen 的问题
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true
    configuration?.setModalOpen(false)
  }, [configuration])

  return (
    <>
      <PopupChatRegistrations />
      <CopilotkitPopup
        agentId="plan"
        defaultOpen={false}
        toggleButton={AgentLauncherButton}
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
