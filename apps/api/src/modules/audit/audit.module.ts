import { Module } from '@nestjs/common'

import { AiQuotaController } from './ai-quota.controller.js'
import { AuditController } from './audit.controller.js'

@Module({
  controllers: [AuditController, AiQuotaController]
})
export class AuditModule {}
