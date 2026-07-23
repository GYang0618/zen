import { Inject, Injectable } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

@Injectable()
export class MembershipService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async ensureDefaultMembership(userId: string, tenantId = DEFAULT_TENANT_ID) {
    return this.prisma.membership.upsert({
      where: {
        tenantId_userId: { tenantId, userId }
      },
      create: { tenantId, userId },
      update: {}
    })
  }
}
