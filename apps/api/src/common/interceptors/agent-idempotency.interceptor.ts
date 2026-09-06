import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import { catchError, from, map, of, switchMap, throwError } from 'rxjs'

import { AgentIdempotencyService } from '../auth/agent-idempotency.service.js'

import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { Request } from 'express'
import type { Observable } from 'rxjs'

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

type AgentRequest = Request & { auth?: AuthContext }

@Injectable()
export class AgentIdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(AgentIdempotencyService) private readonly idempotency: AgentIdempotencyService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AgentRequest>()
    const key = request.get('x-agent-idempotency-key')?.trim()
    if (
      !key ||
      READ_METHODS.has(request.method.toUpperCase()) ||
      !request.auth ||
      isSseOrCopilotRequest(request)
    ) {
      return next.handle()
    }
    if (key.length > 200) throw new BadRequestException('Agent idempotency key is too long')

    const { tenantId, userId } = request.auth
    const requestHash = this.idempotency.hashRequest(request)
    return from(this.idempotency.reserve(tenantId, userId, key, requestHash)).pipe(
      switchMap((reservation) => {
        if (reservation.kind === 'replay') return of(reservation.response)
        if (reservation.kind === 'conflict') {
          throw new ConflictException('Agent request with this idempotency key is still running')
        }
        return next.handle().pipe(
          catchError((error) =>
            from(this.idempotency.release(tenantId, userId, key)).pipe(
              switchMap(() => throwError(() => error))
            )
          ),
          switchMap((response) =>
            from(this.idempotency.complete(tenantId, userId, key, response)).pipe(
              map(() => response)
            )
          )
        )
      })
    )
  }
}

function isSseOrCopilotRequest(request: Request): boolean {
  const accept = request.get('accept') ?? ''
  const contentType = request.get('content-type') ?? ''
  if (accept.includes('text/event-stream') || contentType.includes('text/event-stream')) {
    return true
  }
  const path = `${request.path ?? ''} ${request.originalUrl ?? ''}`
  return path.includes('/copilot')
}
