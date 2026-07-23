import { Module } from '@nestjs/common'

import { FileController } from './file.controller'
import { FileRepository } from './file.repository'
import { FileService } from './file.service'
import { FILES_PRISMA } from './tokens'

import type { DynamicModule, FactoryProvider } from '@nestjs/common'
import type { PrismaClient } from '@prisma/client'

export interface FilesModuleOptions {
  prisma: PrismaClient
}

const sharedProviders = [FileRepository, FileService]

@Module({})
export class FilesModule {
  static forRoot(options: FilesModuleOptions): DynamicModule {
    return {
      module: FilesModule,
      controllers: [FileController],
      providers: [{ provide: FILES_PRISMA, useValue: options.prisma }, ...sharedProviders],
      exports: [FileService]
    }
  }

  static forRootAsync(options: {
    // Nest DI 令牌
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inject: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (...args: any[]) => FilesModuleOptions | Promise<FilesModuleOptions>
  }): DynamicModule {
    const prismaProvider: FactoryProvider = {
      provide: FILES_PRISMA,
      inject: options.inject,
      useFactory: async (...args: unknown[]) => {
        const resolved = await options.useFactory(...args)
        return resolved.prisma
      }
    }

    return {
      module: FilesModule,
      controllers: [FileController],
      providers: [prismaProvider, ...sharedProviders],
      exports: [FileService]
    }
  }
}
