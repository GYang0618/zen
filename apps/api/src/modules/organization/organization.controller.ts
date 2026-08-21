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

import { CurrentAuth } from '@/common/decorators/current-auth.decorator'
import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import {
  addOrganizationMemberSchema,
  changeOrganizationParentSchema,
  createOrganizationSchema,
  linkOrganizationPositionSchema,
  organizationActivitiesQuerySchema,
  updateOrganizationLeaderSchema,
  updateOrganizationPositionSchema,
  updateOrganizationSchema,
  updateOrganizationTypeCatalogSchema
} from './dto'
import { OrganizationService } from './organization.service'

import type { AuthContext } from '@zen/shared'
import type {
  AddOrganizationMemberDto,
  ChangeOrganizationParentDto,
  CreateOrganizationDto,
  CreatePositionDto,
  OrganizationActivitiesQueryDto,
  UpdateOrganizationDto,
  UpdateOrganizationLeaderDto,
  UpdateOrganizationPositionDto,
  UpdateOrganizationTypeCatalogDto
} from './dto'

@ApiTags('组织管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@ApiStandardErrorResponses()
@Controller('organizations')
export class OrganizationController {
  constructor(
    @Inject(OrganizationService) private readonly organizationService: OrganizationService
  ) {}

  @Get('tree')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '获取按名称排序的组织树' })
  getTree(@CurrentAuth() auth: AuthContext) {
    return this.organizationService.getTree(auth)
  }

  @Get('type-catalog')
  @ApiOperation({ summary: '获取本企业组织类型目录' })
  getTypeCatalog(@CurrentAuth() auth: AuthContext) {
    return this.organizationService.getTypeCatalog(auth)
  }

  @Patch('type-catalog')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '更新本企业组织类型开关与名称' })
  @UsePipes(new ZodValidationPipe(updateOrganizationTypeCatalogSchema))
  updateTypeCatalog(
    @Body() payload: UpdateOrganizationTypeCatalogDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.updateTypeCatalog(payload, auth)
  }

  @Post()
  @RequirePermission(PermissionCode.ORG_CREATE)
  @ApiOperation({ summary: '创建组织' })
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  create(@Body() payload: CreateOrganizationDto, @CurrentAuth() auth: AuthContext) {
    return this.organizationService.create(payload, auth)
  }

  @Get(':id')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '获取组织详情' })
  @ApiParam({ name: 'id', description: '组织 ID' })
  findOne(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.organizationService.findOne(id, auth)
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '更新组织基础信息' })
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  update(
    @Param('id') id: string,
    @Body() payload: UpdateOrganizationDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.update(id, payload, auth)
  }

  @Patch(':id/leader')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '变更组织负责人' })
  @UsePipes(new ZodValidationPipe(updateOrganizationLeaderSchema))
  updateLeader(
    @Param('id') id: string,
    @Body() payload: UpdateOrganizationLeaderDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.updateLeader(id, payload, auth)
  }

  @Patch(':id/parent')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '变更组织父级，不支持手工排序' })
  @UsePipes(new ZodValidationPipe(changeOrganizationParentSchema))
  changeParent(
    @Param('id') id: string,
    @Body() payload: ChangeOrganizationParentDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.changeParent(id, payload, auth)
  }

  @Get(':id/members')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '获取组织成员' })
  listMembers(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.organizationService.listMembers(id, auth)
  }

  @Post(':id/members')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({ summary: '批量添加组织成员' })
  @UsePipes(new ZodValidationPipe(addOrganizationMemberSchema))
  addMember(
    @Param('id') id: string,
    @Body() payload: AddOrganizationMemberDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.addMember(id, payload, auth)
  }

  @Delete(':id/members/:userId')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除组织成员' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentAuth() auth: AuthContext
  ): Promise<void> {
    await this.organizationService.removeMember(id, userId, auth)
  }

  @Get(':id/positions')
  @RequirePermission(PermissionCode.POST_LIST)
  @ApiOperation({ summary: '获取组织岗位编制' })
  listPositions(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.organizationService.listPositions(id, auth)
  }

  @Post(':id/positions')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '关联岗位目录并设置编制' })
  @UsePipes(new ZodValidationPipe(linkOrganizationPositionSchema))
  createPosition(
    @Param('id') id: string,
    @Body() payload: CreatePositionDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.createPosition(id, payload, auth)
  }

  @Patch(':id/positions/:positionId')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '更新组织岗位编制' })
  @UsePipes(new ZodValidationPipe(updateOrganizationPositionSchema))
  updatePosition(
    @Param('id') id: string,
    @Param('positionId') positionId: string,
    @Body() payload: UpdateOrganizationPositionDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.updatePosition(id, positionId, payload, auth)
  }

  @Delete(':id/positions/:positionId')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '解除组织岗位编制关联' })
  async removePosition(
    @Param('id') id: string,
    @Param('positionId') positionId: string,
    @CurrentAuth() auth: AuthContext
  ): Promise<void> {
    await this.organizationService.removePosition(id, positionId, auth)
  }

  @Get(':id/activities')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({ summary: '分页获取组织活动' })
  @UsePipes(new ZodValidationPipe(organizationActivitiesQuerySchema, { types: ['query'] }))
  listActivities(
    @Param('id') id: string,
    @Query() query: OrganizationActivitiesQueryDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.listActivities(id, query, auth)
  }
}
