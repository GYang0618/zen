import { Module } from '@nestjs/common'

import { CommonModule } from '@/common'
import { ConfigModule } from '@/config'
import { LoggerModule } from '@/infra/logger'
import { PrismaModule } from '@/infra/prisma'
import { AuthModule, CopilotModule, HealthModule, UserModule } from '@/modules'

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    HealthModule,
    UserModule,
    CopilotModule
  ]
})
export class AppModule {}
