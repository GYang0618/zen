import { Module } from '@nestjs/common'

import { CopilotController } from './copilot.controller'
import { CopilotService } from './copilot.service'
import { DefaultAgentRuntimeController } from './default-agent-runtime.controller'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store'
import { DefaultAgentRunControl } from './default-agent-run-control'

@Module({
  controllers: [DefaultAgentRuntimeController, CopilotController],
  providers: [CopilotService, DefaultAgentRuntimeStore, DefaultAgentRunControl]
})
export class CopilotModule {}
