import { useAgentContext } from '@copilotkit/react-core/v2'

import { AGENT_INSTRUCTIONS } from './prompts/agent-instructions'

export function useCopilotAgentContext() {
  useAgentContext({
    description: '角色管理模块的操作范围与可用工具说明',
    value: AGENT_INSTRUCTIONS
  })
}
