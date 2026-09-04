import { Module } from '@nestjs/common'
import { LoggerModule as Logger } from 'nestjs-pino'

import { resolveTraceId, TRACE_ID_HEADER } from '@/common/utils/trace-id'
import { CONFIG_NAMESPACES } from '@/config'

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AppConfig, LoggerConfig } from '@/config'

@Module({
  imports: [
    Logger.forRootAsync({
      imports: [],
      providers: [],
      inject: [CONFIG_NAMESPACES.APP, CONFIG_NAMESPACES.LOGGER],
      useFactory: (appCfg: AppConfig, loggerCfg: LoggerConfig) => {
        const isProduction = appCfg.nodeEnv === 'production'

        return {
          pinoHttp: {
            level: loggerCfg.level,
            redact: loggerCfg.redact,
            autoLogging: true,
            genReqId: (req: IncomingMessage, res: ServerResponse) => {
              const traceId = resolveTraceId({
                headers: req.headers
              })
              res.setHeader(TRACE_ID_HEADER, traceId)
              return traceId
            },
            customProps: (req: IncomingMessage) => {
              const id = (req as IncomingMessage & { id?: string | number }).id
              return { traceId: id }
            },
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
