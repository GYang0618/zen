import { Module } from '@nestjs/common'

import { UserTool } from './tools/user.tool'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserTool],
  exports: [UserService, UserTool]
})
export class UserModule {}
