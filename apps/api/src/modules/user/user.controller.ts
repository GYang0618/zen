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

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'

import { createUserSchema } from './dto/create-user.dto'
import { deleteUsersSchema } from './dto/delete-users.dto'
import { findUsersQuerySchema } from './dto/find-users-query.dto'
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
  UserInfoSuccessSwaggerDto,
  UserListItemArraySuccessSwaggerDto,
  UserListSuccessSwaggerDto
} from './swagger'
import { UserService } from './user.service'

import type { Request } from 'express'
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface'
import type { CreateUserDto } from './dto/create-user.dto'
import type { DeleteUsersDto } from './dto/delete-users.dto'
import type { FindUsersQueryDto } from './dto/find-users-query.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UpdateUsersStatusDto } from './dto/update-users-status.dto'
import type {
  UserInfoResponse,
  UserListItemResponse,
  UserListResponse
} from './responses/user.response'

@ApiTags('用户管理')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('user')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: '创建用户',
    description: '注册新用户账号，分配默认 user 角色，返回列表行结构。'
  })
  @ApiBody({ type: CreateUserSwaggerDto })
  @ApiCreatedResponse({
    description: '创建成功',
    type: CreateUserSuccessSwaggerDto
  })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  create(@Body() createUserDto: CreateUserDto): Promise<UserListItemResponse> {
    return this.userService.create(createUserDto)
  }

  @Get()
  @ApiOperation({
    summary: '分页查询用户列表',
    description: '支持关键字、状态、角色筛选及排序，返回 items 与 pagination。'
  })
  @ApiFindUsersQueryDocs()
  @ApiOkResponse({ description: '查询成功', type: UserListSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(findUsersQuerySchema, { types: ['query'] }))
  findAll(@Query() query?: FindUsersQueryDto): Promise<UserListResponse> {
    return this.userService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取用户详情',
    description: '按用户 ID 返回完整档案，含角色、权限、组织与安全信息。'
  })
  @ApiParam({
    name: 'id',
    description: '用户 ID（UUID）',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  @ApiOkResponse({ description: '查询成功', type: UserInfoSuccessSwaggerDto })
  @ApiStandardErrorResponses()
  findOne(@Param('id') id: string): Promise<UserInfoResponse> {
    return this.userService.getUserInfoByUserId(id)
  }

  @Patch('restore')
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
  @ApiOperation({
    summary: '更新用户',
    description: '按 ID 更新用户资料；若传入 password 将重新哈希存储。'
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
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserListItemResponse> {
    return this.userService.update(id, updateUserDto)
  }

  @Delete()
  @ApiOperation({
    summary: '批量软删除用户',
    description: '逻辑删除指定用户，禁止删除当前登录用户自身。'
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
