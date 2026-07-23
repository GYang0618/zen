import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { JOB_STATUS } from '../constants'
import { JobRepository } from './job.repository'

import type { AuthContext } from '@zen/shared'
import type { CreateJobInput, JobDto } from '../job.schema'

@Injectable()
export class JobService {
  constructor(@Inject(JobRepository) private readonly jobRepo: JobRepository) {}

  async list(auth: AuthContext): Promise<JobDto[]> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const rows = await this.jobRepo.findManyByTenant(tenantId)
    return rows.map(toDto)
  }

  async get(id: string, auth: AuthContext): Promise<JobDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const row = await this.jobRepo.findById(id, tenantId)
    if (!row) throw new NotFoundException('任务不存在')
    return toDto(row)
  }

  /** MVP 同步假执行器：创建后立即置为完成态，后续可替换为真实队列消费 */
  async create(input: CreateJobInput, auth: AuthContext): Promise<JobDto> {
    const tenantId = auth.tenantId || DEFAULT_TENANT_ID
    const created = await this.jobRepo.create({
      tenantId,
      name: input.name,
      status: JOB_STATUS.PENDING,
      payload: input.payload,
      createdBy: auth.userId
    })

    const finished = await this.jobRepo.finish(created.id, {
      status: JOB_STATUS.COMPLETED,
      result: { ok: true }
    })
    return toDto(finished)
  }
}

function toDto(row: {
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
}): JobDto {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    status: row.status,
    payload: row.payload,
    result: row.result,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null
  }
}
