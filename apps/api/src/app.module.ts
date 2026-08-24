import { Module } from '@nestjs/common'

import { CommonModule } from '@/common'
import { ConfigModule } from '@/config'
import { LoggerModule } from '@/infra/logger'
import { PrismaModule } from '@/infra/prisma'
import {
  AuditModule,
  AuthModule,
  ChatModule,
  CopilotModule,
  DictModule,
  HealthModule,
  OrganizationModule,
  PluginModule,
  PostModule,
  RoleModule,
  StorageModule,
  UserModule
} from '@/modules'
import { PluginsModule } from '@/plugins.module'

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    HealthModule,
    UserModule,
    StorageModule,
    RoleModule,
    OrganizationModule,
    PostModule,
    DictModule,
    AuditModule,
    PluginModule,
    PluginsModule,
    ChatModule,
    CopilotModule
  ]
})
export class AppModule {}
