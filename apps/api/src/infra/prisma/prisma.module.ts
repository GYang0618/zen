import { Global, Module } from '@nestjs/common'

import { CONFIG_NAMESPACES } from '@/config'

import { PrismaService } from './prisma.service'

import type { DatabaseConfig } from '@/config'

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      inject: [CONFIG_NAMESPACES.DATABASE],
      useFactory: (dbConfig: DatabaseConfig) => {
        return new PrismaService(dbConfig.url)
      }
    }
  ],
  exports: [PrismaService]
})
export class PrismaModule {}
