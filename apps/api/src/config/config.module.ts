import { Module } from '@nestjs/common'
import { ConfigModule as Config } from '@nestjs/config'

import {
  appConfig,
  authConfig,
  databaseConfig,
  loggerConfig,
  securityConfig,
  swaggerConfig
} from './modules'
import { validate } from './validate'

@Module({
  imports: [
    Config.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate,
      load: [appConfig, authConfig, databaseConfig, loggerConfig, securityConfig, swaggerConfig]
    })
  ]
})
export class ConfigModule {}
