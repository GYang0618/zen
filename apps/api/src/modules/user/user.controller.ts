import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common'

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'

import { createUserSchema } from './dto/create-user.dto'
import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { updateUserSchema } from './dto/update-user.dto'
import { UserService } from './user.service'

import type { CreateUserDto } from './dto/create-user.dto'
import type { FindUsersQueryDto } from './dto/find-users-query.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UserInfoResponse, UserListResponse } from './responses/user.response'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  create(@Body() createUserDto: CreateUserDto): Promise<UserInfoResponse> {
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

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserInfoResponse> {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<UserInfoResponse> {
    return this.userService.remove(id)
  }
}
