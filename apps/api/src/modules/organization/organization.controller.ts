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

import { CurrentAuth } from '../../common/decorators/current-auth.decorator.js'
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import {
  addOrganizationMemberSchema,
  batchTransferMembersSchema,
  changeOrganizationParentSchema,
  createOrganizationSchema,
  dissolveOrganizationSchema,
  findOrganizationsQuerySchema,
  linkOrganizationPositionSchema,
  mergeOrganizationSchema,
  organizationActivitiesQuerySchema,
  organizationStatisticsQuerySchema,
  organizationTreeQuerySchema,
  updateOrganizationLeaderSchema,
  updateOrganizationPositionSchema,
  updateOrganizationSchema,
  updateOrganizationTypeCatalogSchema,
  updatePositionRolesSchema
} from './dto/index.js'
import { OrganizationService } from './organization.service.js'

import type { AuthContext } from '@zen/shared'
import type {
  AddOrganizationMemberDto,
  BatchTransferMembersDto,
  ChangeOrganizationParentDto,
  CreateOrganizationDto,
  CreatePositionDto,
  DissolveOrganizationDto,
  FindOrganizationsQueryDto,
  MergeOrganizationDto,
  OrganizationActivitiesQueryDto,
  OrganizationStatisticsQueryDto,
  OrganizationTreeQueryDto,
  UpdateOrganizationDto,
  UpdateOrganizationLeaderDto,
  UpdateOrganizationPositionDto,
  UpdateOrganizationTypeCatalogDto,
  UpdatePositionRolesDto
} from './dto/index.js'
import type { OrganizationStatisticsResponse } from './responses/organization.response.js'

@ApiTags('组织管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@ApiStandardErrorResponses()
@Controller('organizations')
export class OrganizationController {
  constructor(
    @Inject(OrganizationService) private readonly organizationService: OrganizationService
  ) {}

  @Get()
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({
    summary: '查询组织列表',
    description: '支持按关键字、组织类型等条件筛选平铺列表'
  })
  @UsePipes(new ZodValidationPipe(findOrganizationsQuerySchema, { types: ['query'] }))
  findAll(@Query() query: FindOrganizationsQueryDto | undefined, @CurrentAuth() auth: AuthContext) {
    return this.organizationService.findAll(query, auth)
  }

  @Get('tree')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({
    summary: '获取按名称排序的组织树',
    description: '支持按关键字过滤组织树，保留匹配节点及其祖先路径'
  })
  @ApiQuery({ name: 'keyword', required: false, description: '关键字过滤（匹配名称或编码）' })
  @UsePipes(new ZodValidationPipe(organizationTreeQuerySchema, { types: ['query'] }))
  getTree(@CurrentAuth() auth: AuthContext, @Query() query?: OrganizationTreeQueryDto) {
    return this.organizationService.getTree(auth, query)
  }

  @Get('type-catalog')
  @ApiOperation({ summary: '获取本企业组织类型目录' })
  getTypeCatalog(@CurrentAuth() auth: AuthContext) {
    return this.organizationService.getTypeCatalog(auth)
  }

  @Get('statistics')
  @RequirePermission(PermissionCode.ORG_LIST)
  @ApiOperation({
    summary: '获取组织架构聚合统计数据',
    description:
      '聚合统计组织节点总数、各类型分布、根组织与最大层级深度、负责人健全度及成员规模排行。支持按根节点筛选子树。'
  })
  @ApiQuery({
    name: 'rootId',
    required: false,
    type: String,
    description: '根组织 ID，指定后仅统计该组织及其所有子级组织',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @UsePipes(new ZodValidationPipe(organizationStatisticsQuerySchema, { types: ['query'] }))
  getStatistics(
    @CurrentAuth() auth: AuthContext,
    @Query() query?: OrganizationStatisticsQueryDto
  ): Promise<OrganizationStatisticsResponse> {
    return this.organizationService.getStatistics(auth, query)
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

  @Delete(':id')
  @RequirePermission(PermissionCode.ORG_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除组织',
    description: '仅允许删除没有下级组织、成员和岗位的组织。'
  })
  @ApiParam({ name: 'id', description: '组织 ID' })
  async remove(@Param('id') id: string, @CurrentAuth() auth: AuthContext): Promise<void> {
    await this.organizationService.remove(id, auth)
  }

  @Post(':id/dissolve')
  @RequirePermission(PermissionCode.ORG_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '解散组织与分流安置向导',
    description: '支持将下级组织自动提升至当前父级，并将成员平移至指定目标组织后安全删除。'
  })
  @ApiParam({ name: 'id', description: '组织 ID' })
  @UsePipes(new ZodValidationPipe(dissolveOrganizationSchema))
  async dissolve(
    @Param('id') id: string,
    @Body() payload: DissolveOrganizationDto,
    @CurrentAuth() auth: AuthContext
  ): Promise<void> {
    await this.organizationService.dissolve(id, payload, auth)
  }

  @Post(':id/merge')
  @RequirePermission(PermissionCode.ORG_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '组织合并向导',
    description: '将当前组织及其下级、成员并入目标组织，并删除当前组织。'
  })
  @ApiParam({ name: 'id', description: '源组织 ID' })
  @UsePipes(new ZodValidationPipe(mergeOrganizationSchema))
  async merge(
    @Param('id') id: string,
    @Body() payload: MergeOrganizationDto,
    @CurrentAuth() auth: AuthContext
  ): Promise<void> {
    await this.organizationService.merge(id, payload, auth)
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

  @Post(':id/members/batch-transfer')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '批量跨部门调动组织成员' })
  @UsePipes(new ZodValidationPipe(batchTransferMembersSchema))
  async batchTransfer(
    @Param('id') id: string,
    @Body() payload: BatchTransferMembersDto,
    @CurrentAuth() auth: AuthContext
  ): Promise<void> {
    await this.organizationService.batchTransferMembers(id, payload, auth)
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

  @Patch(':id/positions/:positionId/roles')
  @RequirePermission(PermissionCode.POST_MANAGE)
  @ApiOperation({ summary: '配置岗位编制基准角色（PBAC）' })
  @UsePipes(new ZodValidationPipe(updatePositionRolesSchema))
  updatePositionRoles(
    @Param('id') id: string,
    @Param('positionId') positionId: string,
    @Body() payload: UpdatePositionRolesDto,
    @CurrentAuth() auth: AuthContext
  ) {
    return this.organizationService.updatePositionRoles(id, positionId, payload, auth)
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
