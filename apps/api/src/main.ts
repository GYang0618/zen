import cookie from '@fastify/cookie'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger } from 'nestjs-pino'

import {
  type AppConfig,
  CONFIG_NAMESPACES,
  type SecurityConfig,
  type SwaggerConfig
} from '@/config'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true
  })

  const logger = app.get(Logger)
  app.useLogger(logger)

  const appCfg = app.get<AppConfig>(CONFIG_NAMESPACES.APP)
  const securityCfg = app.get<SecurityConfig>(CONFIG_NAMESPACES.SECURITY)
  const swaggerCfg = app.get<SwaggerConfig>(CONFIG_NAMESPACES.SWAGGER)

  await app.register(cookie)

  const normalizedPrefix = appCfg.apiPrefix.startsWith('/')
    ? appCfg.apiPrefix.slice(1)
    : appCfg.apiPrefix

  if (normalizedPrefix) {
    app.setGlobalPrefix(normalizedPrefix)
  }

  app.enableCors(securityCfg.cors)

  if (!swaggerCfg.enabled) {
    logger.log('Swagger is disabled by configuration')
  }

  const { port, nodeEnv } = appCfg
  const baseUrl = `http://127.0.0.1:${port}`
  logger.log(`Environment: ${nodeEnv} Starting server on ${baseUrl}/${normalizedPrefix}`)
  await app.listen(port, '0.0.0.0')
}
bootstrap()
