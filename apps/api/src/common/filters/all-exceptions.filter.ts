import { Catch, HttpException, HttpStatus, Inject } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Logger } from 'nestjs-pino'

import { appConfig } from '../../config/index.js'
import { resolveTraceId, TRACE_ID_HEADER } from '../utils/trace-id.js'

import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { AppConfig } from '../../config/index.js'
import type { ApiErrorResponse } from '../interfaces/api-response.interface.js'

type HttpRequest = {
  id?: string
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
}

type HttpResponse = {
  setHeader?: (name: string, value: string) => void
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

function extractHttpExceptionReason(exception: HttpException): string | null {
  const response = exception.getResponse()
  if (!isRecord(response)) return null
  return typeof response.reason === 'string' && response.reason.trim() ? response.reason : null
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
    @Inject(HttpAdapterHost)
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(Logger)
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
    const response = ctx.getResponse<HttpResponse>()

    const isHttpException = exception instanceof HttpException
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message = isHttpException ? normalizeHttpExceptionMessage(exception) : '内部服务器错误'

    const traceId = resolveTraceId({
      existingId: request.id,
      headers: request.headers
    })
    request.id = traceId
    response.setHeader?.(TRACE_ID_HEADER, traceId)

    const validationErrors = isHttpException ? extractValidationErrors(exception) : undefined

    const body: ApiErrorResponse = {
      code: statusCode,
      reason: isHttpException ? extractHttpExceptionReason(exception) : null,
      message,
      path: request.url,
      traceId,
      timestamp: new Date().toISOString(),
      error: this.appCfg.isDev && !isHttpException ? serializeError(exception) : null,
      fieldErrors: validationErrors?.fieldErrors ?? null,
      formErrors: validationErrors?.formErrors ?? null
    }

    const logLine = `${request.method} ${request.url} -> ${statusCode} ${message} [${traceId}]`

    if (statusCode >= 500) {
      this.logger.error({ err: exception, traceId }, logLine)
    } else {
      this.logger.warn({ traceId }, logLine)
    }

    httpAdapter.reply(response, body, statusCode)
  }
}
