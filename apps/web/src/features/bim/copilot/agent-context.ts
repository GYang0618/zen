import { useAgentContext } from '@copilotkit/react-core/v2'

import { BIM_AGENT_INSTRUCTIONS } from './prompts/bim-agent-instructions'

export function useCopilotAgentContext() {
  useAgentContext({
    description: '三维 BIM 场景模块的操作范围、坐标约定与可用工具说明',
    value: BIM_AGENT_INSTRUCTIONS
  })
}
