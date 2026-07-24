import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
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

import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import {
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  findRolesQuerySchema,
  updateRoleSchema
} from './dto'
import { RoleService } from './role.service'

import type {
  AssignRoleMembersDto,
  AssignRolePermissionsDto,
  CloneRoleDto,
  CreateRoleDto,
  DeleteRolesDto,
  FindRolesQueryDto,
  UpdateRoleDto
} from './dto'
import type {
  PermissionGroupResponse,
  RoleListItemResponse,
  RoleListResponse,
  RoleMembersResponse,
  RoleResponse
} from './responses/role.response'

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
  @ApiOperation({ summary: '创建角色', description: '创建自定义角色并可选分配权限。' })
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
    summary: '获取权限列表',
    description: '按模块分组返回全部权限，供角色权限配置使用。'
  })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  listPermissions(): Promise<PermissionGroupResponse[]> {
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
    description: '基于已有角色深拷贝权限与数据边界生成新角色。'
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

  @Patch(':id/permissions')
  @RequirePermission(PermissionCode.ROLE_ASSIGN)
  @ApiOperation({ summary: '分配角色权限', description: '覆盖式更新角色的权限列表。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiBody({ description: '权限编码列表' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(assignRolePermissionsSchema))
  assignPermissions(
    @Param('id') id: string,
    @Body() payload: AssignRolePermissionsDto
  ): Promise<RoleResponse> {
    return this.roleService.assignPermissions(id, payload)
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.ROLE_UPDATE)
  @ApiOperation({ summary: '更新角色', description: '更新角色基础信息与权限。' })
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
