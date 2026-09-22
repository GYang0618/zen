import { useAgentContext } from '@copilotkit/react-core/v2'

import { GIS_AGENT_INSTRUCTIONS } from '../prompts/agent-instructions'

export function usePromptContext() {
  useAgentContext({
    description: '三维 GIS 场景模块的操作范围、坐标约定与可用工具说明',
    value: GIS_AGENT_INSTRUCTIONS
  })
}
