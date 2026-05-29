import { useAgentContext } from '@copilotkit/react-core/v2'

import { AGENT_INSTRUCTIONS } from '../prompts/agent-instructions'

export function usePromptContext() {
  useAgentContext({
    description: '三维 BIM 场景模块的操作范围、坐标约定与可用工具说明',
    value: AGENT_INSTRUCTIONS
  })
}
