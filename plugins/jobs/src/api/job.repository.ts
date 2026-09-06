import { Inject, Injectable } from '@nestjs/common'

import { JOBS_PRISMA } from './tokens.js'

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

/** JobRecord 模型定义于平台 schema，插件包内 PrismaClient 类型未包含，故用委托桥接 */
type JobRecordDelegate = {
  findMany: (args: {
    where: { tenantId: string }
    orderBy: { createdAt: 'desc' }
  }) => Promise<JobRecord[]>
  findFirst: (args: { where: { id: string; tenantId: string } }) => Promise<JobRecord | null>
  create: (args: {
    data: {
      tenantId: string
      name: string
      status: string
      payload: unknown
      createdBy: string
    }
  }) => Promise<JobRecord>
  update: (args: {
    where: { id: string }
    data: {
      status: string
      result: unknown
      finishedAt: Date
    }
  }) => Promise<JobRecord>
}

@Injectable()
export class JobRepository {
  private readonly jobRecord: JobRecordDelegate

  constructor(@Inject(JOBS_PRISMA) prisma: PrismaClient) {
    this.jobRecord = (prisma as unknown as { jobRecord: JobRecordDelegate }).jobRecord
  }

  findManyByTenant(tenantId: string) {
    return this.jobRecord.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    })
  }

  findById(id: string, tenantId: string) {
    return this.jobRecord.findFirst({
      where: { id, tenantId }
    })
  }

  create(data: {
    tenantId: string
    name: string
    status: string
    payload?: unknown
    createdBy: string
  }) {
    return this.jobRecord.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        status: data.status,
        payload: data.payload ?? undefined,
        createdBy: data.createdBy
      }
    })
  }

  finish(id: string, data: { status: string; result: unknown }) {
    return this.jobRecord.update({
      where: { id },
      data: {
        status: data.status,
        result: data.result ?? undefined,
        finishedAt: new Date()
      }
    })
  }
}
