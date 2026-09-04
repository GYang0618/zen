import { Module } from '@nestjs/common'

import { CopilotController } from './copilot.controller'
import { CopilotService } from './copilot.service'
import { DefaultAgentRunControl } from './default-agent-run-control'
import { DefaultAgentRuntimeController } from './default-agent-runtime.controller'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store'
import {
  AgentApprovalService,
  AgentArtifactService,
  AgentMemoryService,
  AgentMetricsService,
  AgentRunService,
  AgentThreadService
} from './services'

@Module({
  controllers: [DefaultAgentRuntimeController, CopilotController],
  providers: [
    CopilotService,
    DefaultAgentRunControl,
    DefaultAgentRuntimeStore,
    AgentThreadService,
    AgentRunService,
    AgentApprovalService,
    AgentArtifactService,
    AgentMemoryService,
    AgentMetricsService
  ],
  exports: [
    CopilotService,
    DefaultAgentRuntimeStore,
    AgentThreadService,
    AgentRunService,
    AgentApprovalService,
    AgentArtifactService,
    AgentMemoryService,
    AgentMetricsService
  ]
})
export class CopilotModule {}
