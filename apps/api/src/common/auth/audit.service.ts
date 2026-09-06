import { Inject, Injectable } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'
import { getRequestAuditContext } from './request-audit-context.js'

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
  /** 结构化变更快照；写入前序列化以兼容 Prisma InputJsonValue */
  diff?: unknown
}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async write(input: WriteAuditInput) {
    const requestContext = getRequestAuditContext()

    return this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? requestContext?.tenantId ?? DEFAULT_TENANT_ID,
        actorId: input.actorId ?? requestContext?.actorId ?? null,
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        ip: input.ip ?? requestContext?.ip ?? null,
        userAgent: input.userAgent ?? requestContext?.userAgent ?? null,
        traceId: input.traceId ?? requestContext?.traceId ?? null,
        diff:
          input.diff === undefined
            ? undefined
            : (JSON.parse(JSON.stringify(input.diff)) as Prisma.InputJsonValue)
      }
    })
  }
}
