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
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { PermissionCode } from '@zen/shared'

import { CurrentAuth } from '@/common/decorators/current-auth.decorator'
import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import {
  createOrganizationSchema,
  createPostSchema,
  deleteOrganizationsSchema,
  moveOrganizationSchema,
  updateOrganizationSchema,
  updatePostSchema,
  upsertOrganizationMemberSchema
} from './dto'
import { OrganizationService } from './organization.service'

import type { AuthContext } from '@zen/shared'
import type {
  CreateOrganizationDto,
  CreatePostDto,
  DeleteOrganizationsDto,
  MoveOrganizationDto,
  UpdateOrganizationDto,
  UpdatePostDto,
  UpsertOrganizationMemberDto
} from './dto'
import type {
  OrganizationResponse,
  OrganizationTreeResponse
} from './responses/organization.response'

@ApiTags('组织管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('organization')
export class OrganizationController {
  constructor(
    @Inject(OrganizationService) private readonly organizationService: OrganizationService
  ) {}

  @Get('tree')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '获取组织树' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  getTree(@CurrentAuth() auth: AuthContext): Promise<OrganizationTreeResponse> {
    return this.organizationService.getTree(auth)
  }

  @Get('posts')
  @RequirePermission(PermissionCode.POST_LIST)
  @ApiOperation({ summary: '岗位列表' })
  listPosts(@Query('organizationId') organizationId?: string) {
    return this.organizationService.listPosts(organizationId)
  }

  @Post('posts')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '创建岗位' })
  @UsePipes(new ZodValidationPipe(createPostSchema))
  createPost(@Body() payload: CreatePostDto) {
    return this.organizationService.createPost(payload)
  }

  @Patch('posts/:postId')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '更新岗位' })
  @UsePipes(new ZodValidationPipe(updatePostSchema))
  updatePost(@Param('postId') postId: string, @Body() payload: UpdatePostDto) {
    return this.organizationService.updatePost(postId, payload)
  }

  @Delete('posts/:postId')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除岗位' })
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.organizationService.deletePost(postId)
  }

  @Get(':id/members')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '组织成员列表' })
  listMembers(@Param('id') id: string) {
    return this.organizationService.listMembers(id)
  }

  @Post(':id/members')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '添加或更新组织成员' })
  @UsePipes(new ZodValidationPipe(upsertOrganizationMemberSchema))
  upsertMember(@Param('id') id: string, @Body() payload: UpsertOrganizationMemberDto) {
    return this.organizationService.upsertMember(id, payload)
  }

  @Delete(':id/members/:userId')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除组织成员' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    await this.organizationService.removeMember(id, userId)
  }

  @Get(':id')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '获取组织详情' })
  @ApiParam({ name: 'id', description: '组织 ID' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string): Promise<OrganizationResponse> {
    return this.organizationService.findOne(id)
  }

  @Post()
  @RequirePermission(PermissionCode.ORG_CREATE)
  @ApiOperation({ summary: '创建组织' })
  @ApiOkResponse({ description: '创建成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  create(@Body() payload: CreateOrganizationDto): Promise<OrganizationResponse> {
    return this.organizationService.create(payload)
  }

  @Patch(':id/move')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '移动组织（变更父节点并重算 path）' })
  @ApiParam({ name: 'id', description: '组织 ID' })
  @ApiOkResponse({ description: '移动成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(moveOrganizationSchema))
  move(
    @Param('id') id: string,
    @Body() payload: MoveOrganizationDto
  ): Promise<OrganizationResponse> {
    return this.organizationService.move(id, payload)
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '更新组织' })
  @ApiParam({ name: 'id', description: '组织 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  update(
    @Param('id') id: string,
    @Body() payload: UpdateOrganizationDto
  ): Promise<OrganizationResponse> {
    return this.organizationService.update(id, payload)
  }

  @Delete()
  @RequirePermission(PermissionCode.ORG_DELETE)
  @ApiOperation({ summary: '批量删除组织（无子节点且无成员）' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(deleteOrganizationsSchema))
  remove(@Body() payload: DeleteOrganizationsDto): Promise<OrganizationResponse[]> {
    return this.organizationService.remove(payload)
  }
}
