import { createHash } from 'node:crypto'

import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { catchError, from, map, of, switchMap, throwError } from 'rxjs'

import { PrismaService } from '@/infra/prisma'

import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { Request } from 'express'
import type { Observable } from 'rxjs'

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1_000
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

type AgentRequest = Request & { auth?: AuthContext }

@Injectable()
export class AgentIdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AgentRequest>()
    const key = request.get('x-agent-idempotency-key')?.trim()
    if (!key || READ_METHODS.has(request.method.toUpperCase()) || !request.auth) {
      return next.handle()
    }
    if (key.length > 200) throw new BadRequestException('Agent idempotency key is too long')

    const { tenantId, userId } = request.auth
    const requestHash = hashRequest(request)
    return from(this.reserve(tenantId, userId, key, requestHash)).pipe(
      switchMap((reservation) => {
        if (reservation.kind === 'replay') return of(reservation.response)
        if (reservation.kind === 'conflict') {
          throw new ConflictException('Agent request with this idempotency key is still running')
        }
        return next.handle().pipe(
          catchError((error) =>
            from(this.release(tenantId, userId, key)).pipe(switchMap(() => throwError(() => error)))
          ),
          switchMap((response) =>
            from(this.complete(tenantId, userId, key, response)).pipe(map(() => response))
          )
        )
      })
    )
  }

  private async reserve(tenantId: string, userId: string, key: string, requestHash: string) {
    const where = { tenantId_userId_key: { tenantId, userId, key } }
    const existing = await this.prisma.agentIdempotencyRecord.findUnique({ where })
    if (existing && existing.expiresAt <= new Date()) {
      await this.prisma.agentIdempotencyRecord.delete({ where: { id: existing.id } })
    } else if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key was reused with a different request')
      }
      if (existing.status === 'succeeded')
        return { kind: 'replay' as const, response: existing.response }
      return { kind: 'conflict' as const }
    }

    try {
      await this.prisma.agentIdempotencyRecord.create({
        data: {
          tenantId,
          userId,
          key,
          requestHash,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS)
        }
      })
      return { kind: 'execute' as const }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { kind: 'conflict' as const }
      }
      throw error
    }
  }

  private async complete(tenantId: string, userId: string, key: string, response: unknown) {
    await this.prisma.agentIdempotencyRecord.update({
      where: { tenantId_userId_key: { tenantId, userId, key } },
      data: { status: 'succeeded', response: toJson(response) }
    })
  }

  private async release(tenantId: string, userId: string, key: string) {
    await this.prisma.agentIdempotencyRecord.deleteMany({
      where: { tenantId, userId, key, status: 'running' }
    })
  }
}

function hashRequest(request: Request): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        method: request.method,
        path: request.path,
        query: request.query ?? null,
        body: request.body ?? null
      })
    )
    .digest('hex')
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}
