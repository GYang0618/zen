import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UsePipes
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { PermissionCode } from '@zen/shared'

import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import {
  createJobProfileSchema,
  findJobProfilesQuerySchema,
  postStatisticsQuerySchema,
  updateJobProfileSchema
} from './dto/index.js'
import { PostService } from './post.service.js'

import type {
  CreateJobProfileDto,
  FindJobProfilesQueryDto,
  PostStatisticsQueryDto,
  UpdateJobProfileDto
} from './dto/index.js'
import type { PostStatisticsResponse } from './responses/post.response.js'

@ApiTags('岗位管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@ApiStandardErrorResponses()
@Controller('posts')
export class PostController {
  constructor(@Inject(PostService) private readonly postService: PostService) {}

  @Get()
  @RequirePermission(PermissionCode.POST_LIST)
  @ApiOperation({ summary: '分页查询岗位目录' })
  @UsePipes(new ZodValidationPipe(findJobProfilesQuerySchema, { types: ['query'] }))
  findAll(@Query() query: FindJobProfilesQueryDto) {
    return this.postService.findAll(query)
  }

  @Post()
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '创建岗位目录' })
  @UsePipes(new ZodValidationPipe(createJobProfileSchema))
  create(@Body() payload: CreateJobProfileDto) {
    return this.postService.create(payload)
  }

  @Get('statistics')
  @RequirePermission(PermissionCode.POST_LIST)
  @ApiOperation({
    summary: '获取岗位与编制聚合统计数据',
    description:
      '聚合统计岗位目录数量、职级分布、岗位族分布以及组织岗位编制的规划人数、在岗人数、满编/缺编/超编情况。支持按组织筛选。'
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: String,
    description: '组织 ID，指定后仅统计已挂载到该组织编制的岗位',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @UsePipes(new ZodValidationPipe(postStatisticsQuerySchema, { types: ['query'] }))
  getStatistics(@Query() query?: PostStatisticsQueryDto): Promise<PostStatisticsResponse> {
    return this.postService.getStatistics(query)
  }

  @Get(':id')
  @RequirePermission(PermissionCode.POST_LIST)
  @ApiOperation({ summary: '获取岗位目录详情' })
  @ApiParam({ name: 'id', description: '岗位目录 ID' })
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id)
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '更新岗位目录' })
  @ApiParam({ name: 'id', description: '岗位目录 ID' })
  @UsePipes(new ZodValidationPipe(updateJobProfileSchema))
  update(@Param('id') id: string, @Body() payload: UpdateJobProfileDto) {
    return this.postService.update(id, payload)
  }

  @Delete(':id')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除岗位目录',
    description: '仅允许删除未关联任何组织编制的岗位；已关联编制请先解除关联，或改为停用。'
  })
  @ApiParam({ name: 'id', description: '岗位目录 ID' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.postService.remove(id)
  }
}
