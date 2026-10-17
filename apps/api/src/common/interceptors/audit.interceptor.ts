import { Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { maskSecrets } from '@zen/shared'
import { catchError, tap, throwError } from 'rxjs'

import { AuditService } from '../auth/audit.service.js'
import { getRequestAuditContext } from '../auth/request-audit-context.js'
import { AUDIT_META_KEY } from '../decorators/audit.decorator.js'

import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Request } from 'express'
import type { Observable } from 'rxjs'
import type { AuditMeta } from '../decorators/audit.decorator.js'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuditService) private readonly audit: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditMeta | undefined>(AUDIT_META_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!meta) {
      return next.handle()
    }

    const req = context.switchToHttp().getRequest<Request>()
    const idKey = meta.idParam ?? 'id'
    const rawId = req.params?.[idKey] ?? req.params?.id ?? req.params?.userId
    const resourceId = Array.isArray(rawId) ? rawId[0] : rawId
    const endpoint = `${req.method} ${req.route?.path ?? req.path}`

    const base = {
      action: meta.action,
      resource: meta.resource,
      resourceId,
      endpoint
    }

    return next.handle().pipe(
      tap(() => {
        if (!getRequestAuditContext()?.audited) {
          const body = req.body as unknown
          const safeDiff = body && typeof body === 'object' ? maskSecrets(body) : undefined
          this.audit.enqueue({
            ...base,
            result: 'SUCCESS',
            diff: safeDiff
          })
        }
      }),
      catchError((err: { status?: number; statusCode?: number; code?: string | number }) => {
        const status = err?.status ?? err?.statusCode ?? 500
        this.audit.enqueue({
          ...base,
          result: 'FAILURE',
          errorCode: String(err?.code ?? status)
        })
        return throwError(() => err)
      })
    )
  }
}
