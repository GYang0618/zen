import { Module } from '@nestjs/common'

import { PLUGIN_API_LOADERS } from './generated/plugin-api.gen.js'
import { PrismaModule, PrismaService } from './infra/prisma/index.js'

import type { DynamicModule } from '@nestjs/common'

/**
 * 编译期插件 Nest Module 聚合入口（由 plugin-api.gen.ts 驱动）。
 */
@Module({
  imports: [
    PrismaModule,
    ...PLUGIN_API_LOADERS.map(
      (loader) =>
        loader.module.forRootAsync({
          inject: [PrismaService],
          useFactory: (prisma: PrismaService) => ({ prisma })
        }) as DynamicModule
    )
  ]
})
export class PluginsModule {}
