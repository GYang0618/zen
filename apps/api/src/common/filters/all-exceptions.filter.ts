import { Catch, HttpException, HttpStatus, Inject } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { createAuditDiff, resolveRouteTitle } from '@zen/shared'
import { Logger } from 'nestjs-pino'

import { appConfig } from '../../config/index.js'
import { AuditService } from '../auth/audit.service.js'
import { resolveTraceId, TRACE_ID_HEADER } from '../utils/trace-id.js'

import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { AppConfig } from '../../config/index.js'
import type { ApiErrorResponse } from '../interfaces/api-response.interface.js'

const rateLimitAuditCache = new Map<string, number>()
function shouldAuditRateLimit(key: string, now: number): boolean {
  const last = rateLimitAuditCache.get(key)
  if (last && now - last < 60_000) return false
  rateLimitAuditCache.set(key, now)
  if (rateLimitAuditCache.size > 2000) {
    for (const [k, v] of rateLimitAuditCache.entries()) {
      if (now - v >= 60_000) rateLimitAuditCache.delete(k)
    }
  }
  return true
}

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
    private readonly appCfg: AppConfig,
    @Inject(AuditService)
    private readonly audit: AuditService
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

    const requestPath = request.url.split('?')[0] ?? request.url
    const apiPrefix = this.appCfg.apiPrefix.replace(/\/$/, '')
    const routePath =
      apiPrefix && requestPath.startsWith(apiPrefix)
        ? requestPath.slice(apiPrefix.length) || '/'
        : requestPath

    if (statusCode === HttpStatus.FORBIDDEN) {
      const title = resolveRouteTitle(request.method, routePath)
      const attempted = title.replace(/了/, '')
      this.audit.enqueue({
        action: 'security.access.denied',
        result: 'DENIED',
        endpoint: `${request.method} ${routePath}`,
        diff: createAuditDiff({
          summary: `越权访问被拒绝：尝试${attempted}（${message}）`,
          denied: {
            attempted,
            missing: []
          },
          request: {
            method: request.method,
            route: routePath,
            status: 403
          }
        })
      })
    } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      const forwarded = request.headers['x-forwarded-for']
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded
      const dedupeKey = `${ip ?? ''}_${request.method}_${routePath}`
      if (shouldAuditRateLimit(dedupeKey, Date.now())) {
        this.audit.enqueue({
          action: 'security.rate_limited',
          result: 'DENIED',
          endpoint: `${request.method} ${routePath}`,
          diff: createAuditDiff({
            summary: `请求触发限流策略：${message}`,
            request: {
              method: request.method,
              route: routePath,
              status: 429
            }
          })
        })
      }
    }

    const validationErrors = isHttpException ? extractValidationErrors(exception) : undefined

    const body: ApiErrorResponse = {
      code: statusCode,
      reason: isHttpException ? extractHttpExceptionReason(exception) : null,
      message,
      path: requestPath,
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
