import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { JOB_PERMISSIONS, JOBS_PLUGIN_ID } from '../constants'
import { createJobSchema } from '../job.schema'
import { CurrentAuth } from './current-auth'
import { JobService } from './job.service'
import { RequirePermission, RequirePlugin } from './nest-decorators'
import { ZodValidationPipe } from './zod-validation.pipe'

import type { AuthContext } from '@zen/shared'
import type { CreateJobInput, JobDto } from '../job.schema'

@ApiTags('任务中心')
@ApiBearerAuth('access-token')
@RequirePlugin(JOBS_PLUGIN_ID)
@Controller('jobs')
export class JobController {
  constructor(@Inject(JobService) private readonly jobService: JobService) {}

  @Get()
  @RequirePermission(JOB_PERMISSIONS.LIST)
  @ApiOperation({ summary: '任务列表' })
  @ApiOkResponse({ description: '查询成功' })
  list(@CurrentAuth() auth: AuthContext): Promise<JobDto[]> {
    return this.jobService.list(auth)
  }

  @Get(':id')
  @RequirePermission(JOB_PERMISSIONS.LIST)
  @ApiOperation({ summary: '任务详情' })
  get(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<JobDto> {
    return this.jobService.get(id, auth)
  }

  @Post()
  @RequirePermission(JOB_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: '创建任务' })
  create(
    @Body(new ZodValidationPipe(createJobSchema)) body: CreateJobInput,
    @CurrentAuth() auth: AuthContext
  ): Promise<JobDto> {
    return this.jobService.create(body, auth)
  }
}
