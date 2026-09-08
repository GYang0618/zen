import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger'
import { PermissionCode } from '@zen/shared'
import { z } from 'zod'

import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import {
  assignRoleDataScopeSchema,
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  findRolesQuerySchema,
  updateRoleSchema
} from './dto/index.js'
import { RoleService } from './role.service.js'

import type {
  AssignRoleDataScope,
  AssignRoleMembersDto,
  AssignRolePermissionsDto,
  CloneRoleDto,
  CreateRoleDto,
  DeleteRolesDto,
  FindRolesQueryDto,
  UpdateRoleDto
} from './dto/index.js'
import type {
  PermissionGroupResponse,
  RoleListItemResponse,
  RoleListResponse,
  RoleMembersResponse,
  RoleResponse
} from './responses/role.response.js'

const roleMembersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

@ApiTags('角色管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('role')
export class RoleController {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  @Post()
  @RequirePermission(PermissionCode.ROLE_CREATE)
  @ApiOperation({ summary: '创建角色', description: '创建自定义角色壳，权限在详情页配置。' })
  @ApiCreatedResponse({ description: '创建成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createRoleSchema))
  create(@Body() payload: CreateRoleDto): Promise<RoleResponse> {
    return this.roleService.create(payload)
  }

  @Get()
  @RequirePermission(PermissionCode.ROLE_LIST)
  @ApiOperation({ summary: '分页查询角色列表', description: '支持关键字、状态、数据范围筛选。' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(findRolesQuerySchema, { types: ['query'] }))
  findAll(@Query() query?: FindRolesQueryDto): Promise<RoleListResponse> {
    return this.roleService.findAll(query)
  }

  @Get('permissions')
  @RequirePermission(PermissionCode.ROLE_LIST)
  @ApiOperation({
    summary: '获取权限目录',
    description: '按模块分组返回权限目录（含 deprecated 标记）。'
  })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  listPermissions(): Promise<PermissionGroupResponse[]> {
    return this.roleService.listPermissions()
  }

  @Get('permission-catalog')
  @RequirePermission(PermissionCode.ROLE_LIST)
  @ApiOperation({ summary: '获取权限目录（别名）' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  permissionCatalog(): Promise<PermissionGroupResponse[]> {
    return this.roleService.listPermissions()
  }

  @Get(':id')
  @RequirePermission(PermissionCode.ROLE_LIST)
  @ApiOperation({ summary: '获取角色详情', description: '返回角色信息与权限编码列表。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string): Promise<RoleResponse> {
    return this.roleService.findOne(id)
  }

  @Post(':id/clone')
  @RequirePermission(PermissionCode.ROLE_CREATE)
  @ApiOperation({
    summary: '克隆角色',
    description: '复制权限、数据范围与图标；不复制成员。系统角色不可克隆。'
  })
  @ApiParam({ name: 'id', description: '源角色 ID' })
  @ApiCreatedResponse({ description: '克隆成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(cloneRoleSchema))
  clone(@Param('id') id: string, @Body() payload: CloneRoleDto): Promise<RoleResponse> {
    return this.roleService.clone(id, payload)
  }

  @Get(':id/members')
  @RequirePermission(PermissionCode.ROLE_LIST)
  @ApiOperation({ summary: '查询角色关联用户', description: '分页返回已绑定该角色的用户列表。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(roleMembersQuerySchema, { types: ['query'] }))
  listMembers(
    @Param('id') id: string,
    @Query() query?: z.infer<typeof roleMembersQuerySchema>
  ): Promise<RoleMembersResponse> {
    return this.roleService.listMembers(id, query?.page ?? 1, query?.pageSize ?? 100)
  }

  @Post(':id/members')
  @RequirePermission(PermissionCode.ROLE_ASSIGN)
  @ApiOperation({ summary: '绑定用户到角色', description: '将指定用户追加绑定到当前角色。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiBody({ description: '用户 ID 列表' })
  @ApiOkResponse({ description: '绑定成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(assignRoleMembersSchema))
  addMembers(
    @Param('id') id: string,
    @Body() payload: AssignRoleMembersDto
  ): Promise<RoleMembersResponse> {
    return this.roleService.addMembers(id, payload)
  }

  @Delete(':id/members/:userId')
  @RequirePermission(PermissionCode.ROLE_ASSIGN)
  @ApiOperation({ summary: '解绑角色用户', description: '将指定用户从当前角色解绑。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiOkResponse({ description: '解绑成功' })
  @ApiStandardErrorResponses()
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string
  ): Promise<RoleMembersResponse> {
    return this.roleService.removeMember(id, userId)
  }

  @Put(':id/permissions')
  @RequirePermission(PermissionCode.ROLE_UPDATE)
  @ApiOperation({
    summary: '保存角色权限',
    description: '覆盖式更新；需传 baseVersion（updatedAt）做乐观锁。'
  })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(assignRolePermissionsSchema))
  assignPermissions(
    @Param('id') id: string,
    @Body() payload: AssignRolePermissionsDto
  ): Promise<RoleResponse> {
    return this.roleService.assignPermissions(id, payload)
  }

  @Patch(':id/permissions')
  @RequirePermission(PermissionCode.ROLE_UPDATE)
  @ApiOperation({ summary: '保存角色权限（兼容 PATCH）' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(assignRolePermissionsSchema))
  assignPermissionsPatch(
    @Param('id') id: string,
    @Body() payload: AssignRolePermissionsDto
  ): Promise<RoleResponse> {
    return this.roleService.assignPermissions(id, payload)
  }

  @Put(':id/data-scope')
  @RequirePermission(PermissionCode.ROLE_UPDATE)
  @ApiOperation({ summary: '保存角色数据范围', description: '需传 baseVersion 做乐观锁。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(assignRoleDataScopeSchema))
  assignDataScope(
    @Param('id') id: string,
    @Body() payload: AssignRoleDataScope
  ): Promise<RoleResponse> {
    return this.roleService.assignDataScope(id, payload)
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.ROLE_UPDATE)
  @ApiOperation({ summary: '更新角色', description: '更新角色基础信息、状态或数据范围。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(updateRoleSchema))
  update(@Param('id') id: string, @Body() payload: UpdateRoleDto): Promise<RoleResponse> {
    return this.roleService.update(id, payload)
  }

  @Delete()
  @RequirePermission(PermissionCode.ROLE_DELETE)
  @ApiOperation({ summary: '批量删除角色', description: '禁止删除系统内置角色或仍有成员的角色。' })
  @ApiBody({ description: '角色 ID 列表' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(deleteRolesSchema))
  removeMany(@Body() payload: DeleteRolesDto): Promise<RoleListItemResponse[]> {
    return this.roleService.remove(payload.ids)
  }
}
