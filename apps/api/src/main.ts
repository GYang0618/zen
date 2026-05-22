import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'

import { CONFIG_NAMESPACES } from '@/config'

import { AppModule } from './app.module'
import { setupSwagger } from './swagger/setup-swagger'

import type { AppConfig, SecurityConfig, SwaggerConfig } from '@/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  })

  const logger = app.get(Logger)
  app.useLogger(logger)

  const appCfg = app.get<AppConfig>(CONFIG_NAMESPACES.APP)
  const securityCfg = app.get<SecurityConfig>(CONFIG_NAMESPACES.SECURITY)
  const swaggerCfg = app.get<SwaggerConfig>(CONFIG_NAMESPACES.SWAGGER)

  app.use(cookieParser())

  const normalizedPrefix = appCfg.apiPrefix.startsWith('/')
    ? appCfg.apiPrefix.slice(1)
    : appCfg.apiPrefix

  if (normalizedPrefix) {
    app.setGlobalPrefix(normalizedPrefix)
  }

  app.enableCors(securityCfg.cors)

  const { port, nodeEnv } = appCfg
  const baseUrl = `http://127.0.0.1:${port}`

  if (swaggerCfg.enabled) {
    const swaggerJsonPath = await setupSwagger(app, swaggerCfg)
    const docsPath = normalizedPrefix
      ? `/${normalizedPrefix}/${swaggerCfg.path}`
      : `/${swaggerCfg.path}`
    logger.log(`Swagger enabled at ${baseUrl}${docsPath}`)
    logger.log(`Swagger spec written to ${swaggerJsonPath}`)
  } else {
    logger.log('Swagger is disabled by configuration')
  }

  logger.log(`Environment: ${nodeEnv} Starting server on ${baseUrl}/${normalizedPrefix}`)
  await app.listen(port, '0.0.0.0')
}
bootstrap()
