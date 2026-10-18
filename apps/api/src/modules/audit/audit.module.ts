import { Module } from '@nestjs/common'

import { StorageModule } from '../storage/storage.module.js'
import { AiQuotaController } from './ai-quota.controller.js'
import { AuditController } from './audit.controller.js'
import { AuditStatsService } from './audit-stats.service.js'

@Module({
  imports: [StorageModule],
  controllers: [AuditController, AiQuotaController],
  providers: [AuditStatsService]
})
export class AuditModule {}
