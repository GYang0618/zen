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

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import {
  assignRolePermissionsSchema,
  createRoleSchema,
  deleteRolesSchema,
  findRolesQuerySchema,
  updateRoleSchema
} from './dto'
import { RoleService } from './role.service'

import type {
  AssignRolePermissionsDto,
  CreateRoleDto,
  DeleteRolesDto,
  FindRolesQueryDto,
  UpdateRoleDto
} from './dto'
import type {
  PermissionGroupResponse,
  RoleListItemResponse,
  RoleListResponse,
  RoleResponse
} from './responses/role.response'

@ApiTags('角色管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('role')
export class RoleController {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色', description: '创建自定义角色并可选分配权限。' })
  @ApiCreatedResponse({ description: '创建成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createRoleSchema))
  create(@Body() payload: CreateRoleDto): Promise<RoleResponse> {
    return this.roleService.create(payload)
  }

  @Get()
  @ApiOperation({ summary: '分页查询角色列表', description: '支持关键字、状态、数据范围筛选。' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(findRolesQuerySchema, { types: ['query'] }))
  findAll(@Query() query?: FindRolesQueryDto): Promise<RoleListResponse> {
    return this.roleService.findAll(query)
  }

  @Get('permissions')
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
  @ApiOperation({ summary: '获取角色详情', description: '返回角色信息与权限编码列表。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string): Promise<RoleResponse> {
    return this.roleService.findOne(id)
  }

  @Patch(':id/permissions')
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
  @ApiOperation({ summary: '更新角色', description: '更新角色基础信息与权限。' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiOkResponse({ description: '更新成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(updateRoleSchema))
  update(@Param('id') id: string, @Body() payload: UpdateRoleDto): Promise<RoleResponse> {
    return this.roleService.update(id, payload)
  }

  @Delete()
  @ApiOperation({ summary: '批量删除角色', description: '禁止删除系统内置角色或仍有成员的角色。' })
  @ApiBody({ description: '角色 ID 列表' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(deleteRolesSchema))
  removeMany(@Body() payload: DeleteRolesDto): Promise<RoleListItemResponse[]> {
    return this.roleService.remove(payload.ids)
  }
}
