import { Module, RequestMethod } from '@nestjs/common'

import { CopilotService } from './copilot.service.js'
import { CopilotKitMiddleware } from './copilot-kit.middleware.js'

import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

@Module({
  controllers: [],
  providers: [CopilotService, CopilotKitMiddleware]
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
