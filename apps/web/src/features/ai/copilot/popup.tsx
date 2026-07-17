import { CopilotPopup as CopilotkitPopup } from '@copilotkit/react-core/v2'
import { Bot } from 'lucide-react'

import { PopupChatRegistrations } from './components/registrations'

import type { SVGProps } from 'react'

function RobotOpenIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <Bot className={className} strokeWidth={1.75} {...props} />
}

export function CopilotPopup() {
  return (
    <>
      <PopupChatRegistrations />
      <CopilotkitPopup
        agentId="plan"
        defaultOpen={false}
        toggleButton={{
          openIcon: RobotOpenIcon
        }}
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
