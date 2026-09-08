import { createHash } from 'node:crypto'

import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../../infra/prisma/index.js'

import type { Request } from 'express'

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1_000

export type IdempotencyReservation =
  | { kind: 'execute' }
  | { kind: 'replay'; response: unknown }
  | { kind: 'conflict' }

@Injectable()
export class AgentIdempotencyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  hashRequest(request: Pick<Request, 'method' | 'path' | 'query' | 'body'>): string {
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

  async reserve(
    tenantId: string,
    userId: string,
    key: string,
    requestHash: string
  ): Promise<IdempotencyReservation> {
    const where = { tenantId_userId_key: { tenantId, userId, key } }
    const existing = await this.prisma.agentIdempotencyRecord.findUnique({ where })
    if (existing && existing.expiresAt <= new Date()) {
      await this.prisma.agentIdempotencyRecord.delete({ where: { id: existing.id } })
    } else if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key was reused with a different request')
      }
      if (existing.status === 'succeeded') {
        return { kind: 'replay', response: existing.response }
      }
      return { kind: 'conflict' }
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
      return { kind: 'execute' }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { kind: 'conflict' }
      }
      throw error
    }
  }

  async complete(tenantId: string, userId: string, key: string, response: unknown): Promise<void> {
    await this.prisma.agentIdempotencyRecord.update({
      where: { tenantId_userId_key: { tenantId, userId, key } },
      data: { status: 'succeeded', response: toJson(response) }
    })
  }

  async release(tenantId: string, userId: string, key: string): Promise<void> {
    await this.prisma.agentIdempotencyRecord.deleteMany({
      where: { tenantId, userId, key, status: 'running' }
    })
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}
