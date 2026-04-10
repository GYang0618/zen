import { Module } from '@nestjs/common'
import { LoggerModule as Logger } from 'nestjs-pino'

import { type AppConfig, CONFIG_NAMESPACES, type LoggerConfig } from '@/config'

@Module({
  imports: [
    Logger.forRootAsync({
      inject: [CONFIG_NAMESPACES.APP, CONFIG_NAMESPACES.LOGGER],
      useFactory: (appCfg: AppConfig, loggerCfg: LoggerConfig) => {
        const isProduction = appCfg.nodeEnv === 'production'

        return {
          pinoHttp: {
            level: loggerCfg.level,
            redact: loggerCfg.redact,
            autoLogging: true,
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname,req,res,responseTime'
                  }
                }
          }
        }
      }
    })
  ]
})
export class LoggerModule {}
