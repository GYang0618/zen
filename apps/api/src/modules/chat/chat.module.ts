import { Module } from '@nestjs/common'

import { UserModule } from '@/modules/user'

import { DefaultAgent, RoleAgent, UserAgent } from './agents'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatAgentService } from './chat-agent.service'
import { CHAT_AGENTS } from './interfaces/agent.interface'

import type { ChatAgent } from './interfaces/agent.interface'

/**
 * @deprecated 正式 AI 链路使用 CopilotModule + default_agent；此模块仅保留兼容引用，禁止新增能力。
 */
@Module({
  imports: [UserModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatAgentService,
    DefaultAgent,
    RoleAgent,
    UserAgent,
    {
      provide: CHAT_AGENTS,
      useFactory: (
        userAgent: UserAgent,
        roleAgent: RoleAgent,
        defaultAgent: DefaultAgent
      ): readonly ChatAgent[] => [userAgent, roleAgent, defaultAgent],
      inject: [UserAgent, RoleAgent, DefaultAgent]
    }
  ]
})
export class ChatModule {}
