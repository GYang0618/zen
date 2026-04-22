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

  getUsersTool = tool(
    async (input) => {
      const users = await this.userService.findAll(input)
      return users
    },
    {
      name: 'get_users',
      description:
        '查询用户信息，如果是查询所有用户，提示用户列表过长，默认分页返回前10条数据，同时提示用户可以通过分页参数查看更多数据',
      schema: findUsersQuerySchema
    }
  )

  createUserTool = tool(
    async (input) => {
      const user = await this.userService.create(input)
      return user
    },
    {
      name: 'create_user',
      description: '创建一个新用户',
      schema: createUserSchema
    }
  )

  updateUserTool = tool(
    async (input) => {
      const { id, ...data } = input
      const user = await this.userService.update(id, data)
      return user
    },
    {
      name: 'update_user',
      description: '更新一个用户的信息',
      schema: updateUserToolSchema
    }
  )

  deleteUserTool = tool(
    async (input) => {
      const user = await this.userService.remove(input.id)
      return user
    },
    {
      name: 'delete_user',
      description: '删除一个用户',
      schema: userIdSchema
    }
  )

  getTools() {
    return [this.getUsersTool, this.createUserTool, this.updateUserTool, this.deleteUserTool]
  }
}
