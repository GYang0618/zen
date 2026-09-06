import { Module } from '@nestjs/common'

import { JobController } from './job.controller.js'
import { JobRepository } from './job.repository.js'
import { JobService } from './job.service.js'
import { JOBS_PRISMA } from './tokens.js'

import type { DynamicModule, FactoryProvider } from '@nestjs/common'
import type { PrismaClient } from '@prisma/client'

export interface JobsModuleOptions {
  prisma: PrismaClient
}

const sharedProviders = [JobRepository, JobService]

@Module({})
export class JobsModule {
  static forRoot(options: JobsModuleOptions): DynamicModule {
    return {
      module: JobsModule,
      controllers: [JobController],
      providers: [{ provide: JOBS_PRISMA, useValue: options.prisma }, ...sharedProviders],
      exports: [JobService]
    }
  }

  static forRootAsync(options: {
    // Nest DI 令牌
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inject: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (...args: any[]) => JobsModuleOptions | Promise<JobsModuleOptions>
  }): DynamicModule {
    const prismaProvider: FactoryProvider = {
      provide: JOBS_PRISMA,
      inject: options.inject,
      useFactory: async (...args: unknown[]) => {
        const resolved = await options.useFactory(...args)
        return resolved.prisma
      }
    }

    return {
      module: JobsModule,
      controllers: [JobController],
      providers: [prismaProvider, ...sharedProviders],
      exports: [JobService]
    }
  }
}
