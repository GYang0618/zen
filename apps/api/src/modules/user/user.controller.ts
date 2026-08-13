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
  Req,
  UnauthorizedException,
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

import { CurrentAuth } from '@/common/decorators/current-auth.decorator'
import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { RequireStepUp } from '@/common/decorators/require-step-up.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import { adminResetPasswordSchema } from './dto/admin-reset-password.dto'
import { assignUserRolesSchema } from './dto/assign-user-roles.dto'
import { createUserSchema } from './dto/create-user.dto'
import { deleteUsersSchema } from './dto/delete-users.dto'
import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { replaceUserOrganizationsSchema } from './dto/replace-user-organizations.dto'
import { updateUserSchema } from './dto/update-user.dto'
import { updateUsersStatusSchema } from './dto/update-users-status.dto'
import {
  ApiFindUsersQueryDocs,
  CreateUserSuccessSwaggerDto,
  CreateUserSwaggerDto,
  DeleteUsersSwaggerDto,
  UpdateUserSuccessSwaggerDto,
  UpdateUserSwaggerDto,
  UpdateUsersStatusSwaggerDto,
  UserListItemArraySuccessSwaggerDto,
  UserListSuccessSwaggerDto
} from './swagger'
import { UserService } from './user.service'

import type { AuthContext } from '@zen/shared'
import type { Request } from 'express'
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface'
import type { AdminResetPasswordDto } from './dto/admin-reset-password.dto'
import type { AssignUserRolesDto } from './dto/assign-user-roles.dto'
import type { CreateUserDto } from './dto/create-user.dto'
import type { DeleteUsersDto } from './dto/delete-users.dto'
import type { FindUsersQueryDto } from './dto/find-users-query.dto'
import type { ReplaceUserOrganizationsDto } from './dto/replace-user-organizations.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UpdateUsersStatusDto } from './dto/update-users-status.dto'
import type {
  UserListItemResponse,
  UserListResponse,
  UserResponse
} from './responses/user.response'

@ApiTags('用户管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('user')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Post()
  @RequirePermission(PermissionCode.USER_CREATE)
  @ApiOperation({
    summary: '创建用户',
    description: '注册新用户账号。可同时指定初始角色与组织归属；省略角色时分配默认 user 角色。'
  })
  @ApiBody({ type: CreateUserSwaggerDto })
  @ApiCreatedResponse({
    description: '创建成功',
    type: CreateUserSuccessSwaggerDto
  })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.userService.create(createUserDto)
  }

  @Get()
  @RequirePermission(PermissionCode.USER_LIST)
  @ApiOperation({
    summary: '分页查询用户列表',
    description: '支持关键字、状态、角色筛选及排序，返回 items 与 pagination。'
  })
  @ApiFindUsersQueryDocs()
  @ApiOkResponse({ description: '查询成功', type: UserListSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(findUsersQuerySchema, { types: ['query'] }))
  findAll(
    @Query() query: FindUsersQueryDto | undefined,
    @CurrentAuth() auth: AuthContext
  ): Promise<UserListResponse> {
    return this.userService.findAll(query, auth)
  }

  @Get(':id')
  @RequirePermission(PermissionCode.USER_LIST)
  @ApiOperation({
    summary: '获取用户详情',
    description: '按用户 ID 返回扁平用户档案，含角色预览与在职组织/岗位。'
  })
  @ApiParam({
    name: 'id',
    description: '用户 ID（UUID）',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @ApiOkResponse({ description: '查询成功', type: UpdateUserSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.userService.getUserById(id)
  }

  @Patch('restore')
  @RequirePermission(PermissionCode.USER_UPDATE)
  @ApiOperation({
    summary: '批量恢复已软删除用户',
    description: '将已逻辑删除的用户恢复为可用状态。'
  })
  @ApiBody({ type: DeleteUsersSwaggerDto })
  @ApiOkResponse({ description: '恢复成功', type: UserListItemArraySuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(deleteUsersSchema))
  restoreMany(@Body() payload: DeleteUsersDto): Promise<UserListItemResponse[]> {
    return this.userService.restore(payload.ids)
  }

  @Patch('status')
  @RequirePermission(PermissionCode.USER_STATUS)
  @ApiOperation({
    summary: '批量更新用户状态',
    description: '批量设置账号状态；禁用账户请使用 suspended，inactive 仅表示未完成激活。'
  })
  @ApiBody({ type: UpdateUsersStatusSwaggerDto })
  @ApiOkResponse({ description: '更新成功', type: UserListItemArraySuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(updateUsersStatusSchema))
  updateStatus(@Body() payload: UpdateUsersStatusDto): Promise<UserListItemResponse[]> {
    return this.userService.updateStatus(payload)
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.USER_UPDATE)
  @ApiOperation({
    summary: '更新用户',
    description: '按 ID 更新用户资料。用户名与密码不可通过此接口修改。'
  })
  @ApiParam({
    name: 'id',
    description: '用户 ID（UUID）',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @ApiBody({ type: UpdateUserSwaggerDto })
  @ApiOkResponse({ description: '更新成功', type: UpdateUserSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponse> {
    return this.userService.update(id, updateUserDto)
  }

  @Post(':id/unlock')
  @RequirePermission(PermissionCode.USER_UPDATE)
  @ApiOperation({ summary: '解锁用户账号' })
  @ApiOkResponse({ description: '解锁成功', type: UpdateUserSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  unlock(@Param('id') id: string): Promise<UserResponse> {
    return this.userService.unlock(id)
  }

  @Post(':id/reset-password')
  @RequirePermission(PermissionCode.USER_UPDATE)
  @ApiOperation({ summary: '管理员重置用户密码并可选强制改密' })
  @ApiOkResponse({ description: '重置成功', type: UpdateUserSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(adminResetPasswordSchema))
  adminResetPassword(
    @Param('id') id: string,
    @Body() body: AdminResetPasswordDto
  ): Promise<UserResponse> {
    return this.userService.adminResetPassword(id, body.password, body.mustChangePassword ?? true)
  }

  @Patch(':id/roles')
  @RequirePermission(PermissionCode.ROLE_ASSIGN)
  @RequireStepUp()
  @ApiOperation({
    summary: '覆盖式分配用户角色',
    description: '替换用户全部角色；会 bump 权限版本并强制下线目标用户。需要二次确认令牌。'
  })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['roleIds'],
      properties: {
        roleIds: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiOkResponse({ description: '分配成功', type: UpdateUserSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(assignUserRolesSchema))
  assignRoles(@Param('id') id: string, @Body() body: AssignUserRolesDto): Promise<UserResponse> {
    return this.userService.assignRoles(id, body)
  }

  @Patch(':id/organizations')
  @RequirePermission(PermissionCode.ORG_UPDATE)
  @ApiOperation({
    summary: '覆盖式同步用户组织归属',
    description: '替换用户当前在职组织；影响 DataScope，会 bump 权限版本并强制下线。'
  })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['organizations'],
      properties: {
        organizations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['organizationId'],
            properties: {
              organizationId: { type: 'string' },
              isPrimary: { type: 'boolean' },
              postId: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  })
  @ApiOkResponse({ description: '同步成功', type: UpdateUserSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(replaceUserOrganizationsSchema))
  replaceOrganizations(
    @Param('id') id: string,
    @Body() body: ReplaceUserOrganizationsDto
  ): Promise<UserResponse> {
    return this.userService.replaceOrganizations(id, body)
  }

  @Delete()
  @RequirePermission(PermissionCode.USER_DELETE)
  @RequireStepUp()
  @ApiOperation({
    summary: '批量软删除用户',
    description: '逻辑删除指定用户，禁止删除当前登录用户自身。需要二次确认令牌。'
  })
  @ApiBody({ type: DeleteUsersSwaggerDto })
  @ApiOkResponse({ description: '删除成功', type: UserListItemArraySuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(deleteUsersSchema))
  removeMany(
    @Req() request: Request,
    @Body() payload: DeleteUsersDto
  ): Promise<UserListItemResponse[]> {
    return this.userService.remove(payload.ids, this.getCurrentUserId(request))
  }

  @Delete('hard')
  @RequirePermission(PermissionCode.USER_DELETE)
  @ApiOperation({
    summary: '批量物理删除用户',
    description: '从数据库永久移除用户记录，不可恢复；禁止删除当前登录用户自身。'
  })
  @ApiBody({ type: DeleteUsersSwaggerDto })
  @ApiOkResponse({ description: '删除成功', type: UserListItemArraySuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(deleteUsersSchema))
  hardRemoveMany(
    @Req() request: Request,
    @Body() payload: DeleteUsersDto
  ): Promise<UserListItemResponse[]> {
    return this.userService.hardRemove(payload.ids, this.getCurrentUserId(request))
  }

  private getCurrentUserId(request: Request): string {
    const user = (request as unknown as { user?: JwtPayload }).user
    if (!user?.sub) throw new UnauthorizedException('缺少认证信息')
    return user.sub
  }
}
