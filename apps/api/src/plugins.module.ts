import { Module } from '@nestjs/common'
import { DemoNotesModule } from '@zen/plugin-demo-notes/api'
import { FilesModule } from '@zen/plugin-files/api'
import { JobsModule } from '@zen/plugin-jobs/api'
import { NotificationsModule } from '@zen/plugin-notifications/api'

import { PrismaModule, PrismaService } from '@/infra/prisma'

/**
 * 编译期插件 Nest Module 聚合入口。
 * 按仓库插件注册表展开 DynamicModule。
 */
@Module({
  imports: [
    PrismaModule,
    DemoNotesModule.forRootAsync({
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({ prisma })
    }),
    NotificationsModule.forRootAsync({
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({ prisma })
    }),
    FilesModule.forRootAsync({
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({ prisma })
    }),
    JobsModule.forRootAsync({
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({ prisma })
    })
  ]
})
export class PluginsModule {}
