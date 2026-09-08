import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { map } from 'rxjs/operators'

import { BYPASS_TRANSFORM_KEY } from '../decorators/bypass-transform.decorator.js'
import { resolveTraceId, TRACE_ID_HEADER } from '../utils/trace-id.js'

import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import type { ApiResponse } from '../interfaces/api-response.interface.js'

type HttpRequest = {
  id?: string
  headers: Record<string, string | string[] | undefined>
}

type HttpResponse = {
  statusCode?: number
  setHeader?: (name: string, value: string) => void
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const bypass = this.reflector.getAllAndOverride<boolean>(BYPASS_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (bypass) {
      return next.handle()
    }

    const http = context.switchToHttp()
    const request = http.getRequest<HttpRequest>()
    const response = http.getResponse<HttpResponse>()
    const traceId = resolveTraceId({
      existingId: request.id,
      headers: request.headers
    })

    request.id = traceId
    response.setHeader?.(TRACE_ID_HEADER, traceId)

    return next.handle().pipe(
      map((data) => ({
        code: response.statusCode || HttpStatus.OK,
        message: 'Success',
        data,
        traceId,
        timestamp: new Date().toISOString()
      }))
    )
  }
}
