import { randomUUID } from 'node:crypto'

import { Catch, HttpException, HttpStatus, Inject } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Logger } from 'nestjs-pino'

import { appConfig } from '@/config'

import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { AppConfig } from '@/config'
import type { ApiErrorResponse } from '../interfaces/api-response.interface'

type HttpRequest = {
  id?: string
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse()

  if (typeof response === 'string') return response

  if (isRecord(response)) {
    const { message } = response

    if (Array.isArray(message)) {
      return message.map(String).join('; ')
    }

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return exception.message || '请求错误'
}

function serializeError(
  exception: unknown
): { name: string | null; message: string | null; stack: string | null } | null {
  if (exception instanceof Error) {
    return {
      name: exception.name,
      message: exception.message,
      stack: exception.stack ?? null
    }
  }

  return {
    name: null,
    message: String(exception),
    stack: null
  }
}

function extractValidationErrors(
  exception: HttpException
): { fieldErrors: Record<string, string[]>; formErrors: string[] } | undefined {
  const response = exception.getResponse()

  if (!isRecord(response)) return undefined

  const { fieldErrors, formErrors } = response

  if (!isRecord(fieldErrors) && !Array.isArray(formErrors)) return undefined

  return {
    fieldErrors: isRecord(fieldErrors) ? (fieldErrors as Record<string, string[]>) : {},
    formErrors: Array.isArray(formErrors) ? formErrors.map(String) : []
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
    @Inject(appConfig.KEY)
    private readonly appCfg: AppConfig
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      this.logger.error({ err: exception }, '捕获到非 HTTP 异常')
      return
    }

    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<HttpRequest>()

    const isHttpException = exception instanceof HttpException
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message = isHttpException ? normalizeHttpExceptionMessage(exception) : '内部服务器错误'

    const requestId =
      (request.id !== null && request.id !== undefined ? String(request.id) : undefined) ||
      (request.headers['x-request-id'] as string | undefined) ||
      randomUUID()

    const validationErrors = isHttpException ? extractValidationErrors(exception) : undefined

    const body: ApiErrorResponse = {
      code: statusCode,
      message,
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
      error: this.appCfg.isDev && !isHttpException ? serializeError(exception) : null,
      fieldErrors: validationErrors?.fieldErrors ?? null,
      formErrors: validationErrors?.formErrors ?? null
    }

    const logLine = `${request.method} ${request.url} -> ${statusCode} ${message} [${requestId}]`

    if (statusCode >= 500) {
      this.logger.error({ err: exception }, logLine)
    } else {
      this.logger.warn(logLine)
    }

    httpAdapter.reply(ctx.getResponse(), body, statusCode)
  }
}
