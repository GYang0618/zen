import { Module, RequestMethod } from '@nestjs/common'

import { CopilotService } from './copilot.service.js'
import { CopilotKitMiddleware } from './copilot-kit.middleware.js'
import { CopilotThreadController } from './copilot-thread.controller.js'
import { CopilotThreadService } from './copilot-thread.service.js'
import { CopilotTitleService } from './copilot-title.service.js'

import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

@Module({
  controllers: [CopilotThreadController],
  providers: [CopilotService, CopilotThreadService, CopilotTitleService, CopilotKitMiddleware],
  exports: [CopilotService, CopilotThreadService, CopilotTitleService]
})
export class CopilotModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CopilotKitMiddleware)
      .forRoutes(
        { path: 'copilot', method: RequestMethod.ALL },
        { path: 'copilot/{*path}', method: RequestMethod.ALL }
      )
  }
}
