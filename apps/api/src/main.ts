import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { json, urlencoded } from 'express'
import { Logger } from 'nestjs-pino'

import { CONFIG_NAMESPACES } from '@/config'

import { AppModule } from './app.module'
import { setupSwagger } from './swagger/setup-swagger'

import type { AppConfig, SecurityConfig, SwaggerConfig } from '@/config'
import type { NextFunction, Request, Response } from 'express'

/** Copilot 会回传完整对话历史，默认 100kb 不够 */
const COPILOT_JSON_BODY_LIMIT = '10mb'
const DEFAULT_JSON_BODY_LIMIT = '100kb'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // 关闭内置 parser，便于仅对 copilot 提高 JSON limit
    bodyParser: false
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

  const copilotBasePath = normalizedPrefix ? `/${normalizedPrefix}/copilot` : '/copilot'
  const defaultJsonParser = json({ limit: DEFAULT_JSON_BODY_LIMIT })
  const copilotJsonParser = json({ limit: COPILOT_JSON_BODY_LIMIT })

  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.originalUrl.split('?')[0] ?? ''
    const isCopilot = path === copilotBasePath || path.startsWith(`${copilotBasePath}/`)
    return (isCopilot ? copilotJsonParser : defaultJsonParser)(req, res, next)
  })
  app.use(urlencoded({ extended: true }))

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
