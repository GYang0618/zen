import { Module } from '@nestjs/common'

import { UserModule } from '@/modules/user'

import { DefaultAgent, RoleAgent, UserAgent } from './agents'
import { CopilotController } from './copilot.controller'
import { CopilotService } from './copilot.service'
import { CopilotAgentService } from './copilot-agent.service'
import { COPILOT_AGENTS } from './interfaces/agent.interface'

import type { CopilotAgent } from './interfaces/agent.interface'

@Module({
  imports: [UserModule],
  controllers: [CopilotController],
  providers: [
    CopilotService,
    CopilotAgentService,
    DefaultAgent,
    RoleAgent,
    UserAgent,
    {
      provide: COPILOT_AGENTS,
      useFactory: (
        userAgent: UserAgent,
        roleAgent: RoleAgent,
        defaultAgent: DefaultAgent
      ): readonly CopilotAgent[] => [userAgent, roleAgent, defaultAgent],
      inject: [UserAgent, RoleAgent, DefaultAgent]
    }
  ]
})
export class CopilotModule {}
