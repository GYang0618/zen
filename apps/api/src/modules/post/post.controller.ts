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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { PermissionCode } from '@zen/shared'

import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import {
  createJobProfileSchema,
  findJobProfilesQuerySchema,
  updateJobProfileSchema
} from './dto'
import { PostService } from './post.service'

import type { CreateJobProfileDto, FindJobProfilesQueryDto, UpdateJobProfileDto } from './dto'

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
