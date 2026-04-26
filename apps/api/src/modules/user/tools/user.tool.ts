import { Injectable } from '@nestjs/common'
import { tool } from 'langchain'
import { z } from 'zod'

import { createUserSchema } from '../dto/create-user.dto'
import { findUsersQuerySchema } from '../dto/find-users-query.dto'
import { updateUserSchema } from '../dto/update-user.dto'
import { UserService } from '../user.service'

const userIdSchema = z.object({
  id: z.string().min(1, 'User id is required')
})

const updateUserToolSchema = userIdSchema.extend(updateUserSchema.shape)

@Injectable()
export class UserTool {
  constructor(private userService: UserService) {}

  getUsersTool = tool(async (input) => await this.userService.findAll(input), {
    name: 'get_users',
    description: '查询用户，可以通过关键字、用户状态、角色等条件进行查询',
    schema: findUsersQuerySchema
  })

  createUserTool = tool(async (input) => await this.userService.create(input), {
    name: 'create_user',
    description: '创建一个新用户',
    schema: createUserSchema
  })

  updateUserTool = tool(async ({ id, ...data }) => await this.userService.update(id, data), {
    name: 'update_user',
    description: '更新一个用户的信息',
    schema: updateUserToolSchema
  })

  deleteUserTool = tool(async ({ id }) => await this.userService.remove(id), {
    name: 'delete_user',
    description: '删除一个用户',
    schema: userIdSchema
  })

  getTools() {
    return [this.getUsersTool, this.createUserTool, this.updateUserTool, this.deleteUserTool]
  }
}
