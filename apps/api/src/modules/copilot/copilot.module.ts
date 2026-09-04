import { Module } from '@nestjs/common'

import { CopilotController } from './copilot.controller'
import { CopilotService } from './copilot.service'
import { DefaultAgentRunControl } from './default-agent-run-control'
import { DefaultAgentRuntimeController } from './default-agent-runtime.controller'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store'

@Module({
  controllers: [DefaultAgentRuntimeController, CopilotController],
  providers: [CopilotService, DefaultAgentRuntimeStore, DefaultAgentRunControl]
})
export class CopilotModule {}
