import { Module } from '@nestjs/common'

import { StorageModule } from '../storage/storage.module.js'
import { UserTool } from './tools/user.tool.js'
import { UserController } from './user.controller.js'
import { UserRepository } from './user.repository.js'
import { UserService } from './user.service.js'

@Module({
  imports: [StorageModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserTool],
  exports: [UserService, UserTool]
})
export class UserModule {}
