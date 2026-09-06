import { Global, Module } from '@nestjs/common'

import { CONFIG_NAMESPACES } from '../../config/index.js'
import { PrismaService } from './prisma.service.js'

import type { DatabaseConfig } from '../../config/index.js'

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
