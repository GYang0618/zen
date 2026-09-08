import { Module } from '@nestjs/common'

import { DemoNotesEventBus } from './event-bus.js'
import { NoteController } from './note.controller.js'
import { NoteRepository } from './note.repository.js'
import { NoteService } from './note.service.js'
import { DemoNoteCreatedListener } from './note-created.listener.js'
import { DEMO_NOTES_PRISMA } from './tokens.js'

import type { DynamicModule, FactoryProvider } from '@nestjs/common'
import type { PrismaClient } from '@prisma/client'

export interface DemoNotesModuleOptions {
  prisma: PrismaClient
}

const sharedProviders = [NoteRepository, NoteService, DemoNotesEventBus, DemoNoteCreatedListener]

@Module({})
export class DemoNotesModule {
  static forRoot(options: DemoNotesModuleOptions): DynamicModule {
    return {
      module: DemoNotesModule,
      controllers: [NoteController],
      providers: [{ provide: DEMO_NOTES_PRISMA, useValue: options.prisma }, ...sharedProviders],
      exports: [NoteService]
    }
  }

  static forRootAsync(options: {
    // Nest DI tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inject: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory: (...args: any[]) => DemoNotesModuleOptions | Promise<DemoNotesModuleOptions>
  }): DynamicModule {
    const prismaProvider: FactoryProvider = {
      provide: DEMO_NOTES_PRISMA,
      inject: options.inject,
      useFactory: async (...args: unknown[]) => {
        const resolved = await options.useFactory(...args)
        return resolved.prisma
      }
    }

    return {
      module: DemoNotesModule,
      controllers: [NoteController],
      providers: [prismaProvider, ...sharedProviders],
      exports: [NoteService]
    }
  }
}
