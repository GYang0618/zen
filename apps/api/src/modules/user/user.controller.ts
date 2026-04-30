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

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'

import { createUserSchema } from './dto/create-user.dto'
import { deleteUsersSchema } from './dto/delete-users.dto'
import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { updateUserSchema } from './dto/update-user.dto'
import { updateUsersStatusSchema } from './dto/update-users-status.dto'
import { UserService } from './user.service'

import type { FastifyRequest } from 'fastify'
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

@Controller('user')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  create(@Body() createUserDto: CreateUserDto): Promise<UserListItemResponse> {
    return this.userService.create(createUserDto)
  }

  @Get()
  @UsePipes(new ZodValidationPipe(findUsersQuerySchema, { types: ['query'] }))
  findAll(@Query() query?: FindUsersQueryDto): Promise<UserListResponse> {
    return this.userService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserInfoResponse> {
    return this.userService.getUserInfoByUserId(id)
  }

  @Patch('restore')
  @UsePipes(new ZodValidationPipe(deleteUsersSchema))
  restoreMany(@Body() payload: DeleteUsersDto): Promise<UserListItemResponse[]> {
    return this.userService.restore(payload.ids)
  }

  @Patch('status')
  @UsePipes(new ZodValidationPipe(updateUsersStatusSchema))
  updateStatus(@Body() payload: UpdateUsersStatusDto): Promise<UserListItemResponse[]> {
    return this.userService.updateStatus(payload)
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserListItemResponse> {
    return this.userService.update(id, updateUserDto)
  }

  @Delete()
  @UsePipes(new ZodValidationPipe(deleteUsersSchema))
  removeMany(
    @Req() request: FastifyRequest,
    @Body() payload: DeleteUsersDto
  ): Promise<UserListItemResponse[]> {
    return this.userService.remove(payload.ids, this.getCurrentUserId(request))
  }

  @Delete('hard')
  @UsePipes(new ZodValidationPipe(deleteUsersSchema))
  hardRemoveMany(
    @Req() request: FastifyRequest,
    @Body() payload: DeleteUsersDto
  ): Promise<UserListItemResponse[]> {
    return this.userService.hardRemove(payload.ids, this.getCurrentUserId(request))
  }

  private getCurrentUserId(request: FastifyRequest): string {
    const user = (request as unknown as { user?: JwtPayload }).user
    if (!user?.sub) throw new UnauthorizedException('缺少认证信息')
    return user.sub
  }
}
