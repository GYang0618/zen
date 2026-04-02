import { Body, Controller, Delete, Get, Param, Patch, Post, UsePipes } from '@nestjs/common'

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import type { CreateUserDto } from './dto/create-user.dto'
import { createUserSchema } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import { updateUserSchema } from './dto/update-user.dto'
import type { UserInfoResponse } from './responses/user.response'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  create(@Body() createUserDto: CreateUserDto): Promise<UserInfoResponse> {
    return this.userService.create(createUserDto)
  }

  @Get()
  findAll(): Promise<UserInfoResponse[]> {
    return this.userService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserInfoResponse> {
    return this.userService.getUserInfoByUserId(id)
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserInfoResponse> {
    return this.userService.update({
      where: { id },
      data: updateUserDto
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<UserInfoResponse> {
    return this.userService.remove(id)
  }
}
