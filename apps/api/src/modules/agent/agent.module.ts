import { Module } from '@nestjs/common'

import { CopilotModule } from '../copilot/copilot.module.js'

/** Agent 域：CopilotKit runtime、AG-UI 与 Default Agent 账本。 */
@Module({
  imports: [CopilotModule]
})
export class AgentModule {}
