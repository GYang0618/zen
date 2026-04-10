import { Module } from '@nestjs/common'

import { UserModule } from '@/modules/user'

import { CopilotController } from './copilot.controller'
import { CopilotService } from './copilot.service'

@Module({
  imports: [UserModule],
  controllers: [CopilotController],
  providers: [CopilotService]
})
export class CopilotModule {}
