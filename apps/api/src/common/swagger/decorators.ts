import { applyDecorators } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'

import { ApiErrorResponseSwaggerDto } from './api-error-response.swagger.dto.js'

/** 用户模块等受保护接口的通用错误响应文档 */
export function ApiStandardErrorResponses() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: '未认证或令牌无效',
      type: ApiErrorResponseSwaggerDto
    }),
    ApiBadRequestResponse({
      description: '请求参数校验失败',
      type: ApiErrorResponseSwaggerDto
    }),
    ApiNotFoundResponse({
      description: '资源不存在',
      type: ApiErrorResponseSwaggerDto
    })
  )
}
