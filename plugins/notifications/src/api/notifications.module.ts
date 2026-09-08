import { Module } from '@nestjs/common'

import { NotificationController } from './notification.controller.js'
import { NotificationRepository } from './notification.repository.js'
import { NotificationService } from './notification.service.js'
import { NOTIFICATIONS_PRISMA } from './tokens.js'

import type { DynamicModule, FactoryProvider } from '@nestjs/common'
import type { PrismaClient } from '@prisma/client'

export interface NotificationsModuleOptions {
  prisma: PrismaClient
}

const sharedProviders = [NotificationRepository, NotificationService]

@Module({})
export class NotificationsModule {
  static forRoot(options: NotificationsModuleOptions): DynamicModule {
    return {
      module: NotificationsModule,
      controllers: [NotificationController],
      providers: [{ provide: NOTIFICATIONS_PRISMA, useValue: options.prisma }, ...sharedProviders],
      exports: [NotificationService]
    }
  }

  static forRootAsync(options: {
    // Nest DI 令牌
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inject: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (...args: any[]) => NotificationsModuleOptions | Promise<NotificationsModuleOptions>
  }): DynamicModule {
    const prismaProvider: FactoryProvider = {
      provide: NOTIFICATIONS_PRISMA,
      inject: options.inject,
      useFactory: async (...args: unknown[]) => {
        const resolved = await options.useFactory(...args)
        return resolved.prisma
      }
    }

    return {
      module: NotificationsModule,
      controllers: [NotificationController],
      providers: [prismaProvider, ...sharedProviders],
      exports: [NotificationService]
    }
  }
}
