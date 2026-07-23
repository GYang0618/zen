import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { ACCESS_TOKEN_AUTH } from '@/common/swagger'

import type { INestApplication } from '@nestjs/common'
import type { OpenAPIObject } from '@nestjs/swagger'
import type { SwaggerConfig } from '@/config'

/**
 * 将 OpenAPI 文档写入本地 JSON 文件（供 @hey-api/openapi-ts 等工具消费）
 */
async function writeSwaggerJsonFile(document: OpenAPIObject, outputPath: string): Promise<string> {
  const absolutePath = isAbsolute(outputPath) ? outputPath : resolve(process.cwd(), outputPath)
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
  return absolutePath
}

/**
 * 初始化 OpenAPI 文档（AppModule 已注册的全部控制器）并导出 swagger.json。
 * 不使用 include 白名单，避免漏配业务 Module。
 * @returns 写入的 swagger.json 绝对路径
 */
export async function setupSwagger(
  app: INestApplication,
  swaggerCfg: SwaggerConfig
): Promise<string> {
  const config = new DocumentBuilder()
    .setTitle(swaggerCfg.title)
    .setDescription(swaggerCfg.description)
    .setVersion(swaggerCfg.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '在 Authorization 头中传入 access token，格式：Bearer <token>'
      },
      ACCESS_TOKEN_AUTH
    )
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`
  })

  SwaggerModule.setup(swaggerCfg.path, app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'openapi.json',
    yamlDocumentUrl: 'openapi.yaml'
  })

  return writeSwaggerJsonFile(document, swaggerCfg.jsonOutputPath)
}
