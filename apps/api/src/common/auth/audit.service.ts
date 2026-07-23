import { Inject, Injectable } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import type { Prisma } from '@prisma/client'

export type WriteAuditInput = {
  tenantId?: string
  actorId?: string
  action: string
  resource?: string
  resourceId?: string
  ip?: string
  userAgent?: string
  traceId?: string
  diff?: Prisma.InputJsonValue
}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async write(input: WriteAuditInput) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? DEFAULT_TENANT_ID,
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        traceId: input.traceId ?? null,
        diff: input.diff ?? undefined
      }
    })
  }
}
