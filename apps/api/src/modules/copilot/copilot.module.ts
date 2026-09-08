import { Module, RequestMethod } from '@nestjs/common'

import { CopilotService } from './copilot.service.js'
import { CopilotKitMiddleware } from './copilot-kit.middleware.js'
import { DefaultAgentApprovalService } from './default-agent-approval.service.js'
import { DefaultAgentArtifactService } from './default-agent-artifact.service.js'
import { DefaultAgentCheckpointService } from './default-agent-checkpoint.service.js'
import { DefaultAgentEventService } from './default-agent-event.service.js'
import { DefaultAgentMemoryService } from './default-agent-memory.service.js'
import { DefaultAgentMetricsService } from './default-agent-metrics.service.js'
import { DefaultAgentReconciliationService } from './default-agent-reconciliation.service.js'
import { DefaultAgentRunService } from './default-agent-run.service.js'
import { DefaultAgentRunControl } from './default-agent-run-control.js'
import { DefaultAgentRuntimeController } from './default-agent-runtime.controller.js'
import { DefaultAgentRuntimeStore } from './default-agent-runtime.store.js'
import { DefaultAgentThreadService } from './default-agent-thread.service.js'
import { DefaultAgentToolLedgerService } from './default-agent-tool-ledger.service.js'

import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

@Module({
  controllers: [DefaultAgentRuntimeController],
  providers: [
    CopilotService,
    CopilotKitMiddleware,
    DefaultAgentRuntimeStore,
    DefaultAgentRunControl,
    DefaultAgentArtifactService,
    DefaultAgentApprovalService,
    DefaultAgentCheckpointService,
    DefaultAgentEventService,
    DefaultAgentMemoryService,
    DefaultAgentMetricsService,
    DefaultAgentReconciliationService,
    DefaultAgentRunService,
    DefaultAgentThreadService,
    DefaultAgentToolLedgerService
  ]
})
export class CopilotModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CopilotKitMiddleware)
      .exclude(
        { path: 'copilot/runtime', method: RequestMethod.ALL },
        { path: 'copilot/runtime/{*path}', method: RequestMethod.ALL }
      )
      .forRoutes(
        { path: 'copilot', method: RequestMethod.ALL },
        { path: 'copilot/{*path}', method: RequestMethod.ALL }
      )
  }
}
