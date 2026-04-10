import { Global, Module } from '@nestjs/common'

import { CONFIG_NAMESPACES, type DatabaseConfig } from '@/config'

import { PrismaService } from './prisma.service'

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
