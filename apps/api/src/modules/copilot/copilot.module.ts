import { Module, RequestMethod } from '@nestjs/common'

import { CopilotService } from './copilot.service.js'
import { CopilotKitMiddleware } from './copilot-kit.middleware.js'
import { CopilotRuntimeController } from './copilot-runtime.controller.js'
import { CopilotThreadController } from './copilot-thread.controller.js'
import { CopilotThreadService } from './copilot-thread.service.js'
import { CopilotTitleService } from './copilot-title.service.js'
import { CopilotUsageService } from './copilot-usage.service.js'

import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

@Module({
  controllers: [CopilotThreadController, CopilotRuntimeController],
  providers: [
    CopilotService,
    CopilotThreadService,
    CopilotTitleService,
    CopilotUsageService,
    CopilotKitMiddleware
  ],
  exports: [CopilotService, CopilotThreadService, CopilotTitleService, CopilotUsageService]
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
