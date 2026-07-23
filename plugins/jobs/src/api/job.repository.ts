import { Inject, Injectable } from '@nestjs/common'

import { JOBS_PRISMA } from './tokens'

import type { PrismaClient } from '@prisma/client'

type JobRecord = {
  id: string
  tenantId: string
  name: string
  status: string
  payload: unknown
  result: unknown
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  finishedAt: Date | null
}

@Injectable()
export class JobRepository {
  constructor(@Inject(JOBS_PRISMA) private readonly prisma: PrismaClient) {}

  findManyByTenant(tenantId: string) {
    // JobRecord 模型定义于平台 schema，插件包内 Prisma 类型未包含，故经 any 桥接
    return (this.prisma as any).jobRecord.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    }) as Promise<JobRecord[]>
  }

  findById(id: string, tenantId: string) {
    return (this.prisma as any).jobRecord.findFirst({
      where: { id, tenantId }
    }) as Promise<JobRecord | null>
  }

  create(data: {
    tenantId: string
    name: string
    status: string
    payload?: unknown
    createdBy: string
  }) {
    return (this.prisma as any).jobRecord.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        status: data.status,
        payload: data.payload ?? undefined,
        createdBy: data.createdBy
      }
    }) as Promise<JobRecord>
  }

  finish(id: string, data: { status: string; result: unknown }) {
    return (this.prisma as any).jobRecord.update({
      where: { id },
      data: {
        status: data.status,
        result: data.result ?? undefined,
        finishedAt: new Date()
      }
    }) as Promise<JobRecord>
  }
}
