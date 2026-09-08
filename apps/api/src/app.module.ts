import { Module } from '@nestjs/common'

import { ConfigModule } from './config/index.js'
import { LoggerModule } from './infra/logger/index.js'
import { PrismaModule } from './infra/prisma/index.js'
import {
  AgentModule,
  ContentModule,
  HealthModule,
  IdentityModule,
  OrganizationModule,
  PluginModule,
  SecurityModule,
  StorageModule
} from './modules/index.js'
import { PluginsModule } from './plugins.module.js'

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    SecurityModule,
    HealthModule,
    IdentityModule,
    StorageModule,
    OrganizationModule,
    ContentModule,
    PluginModule,
    PluginsModule,
    AgentModule
  ]
})
export class AppModule {}
