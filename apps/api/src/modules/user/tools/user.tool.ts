import { Inject, Injectable } from '@nestjs/common'
import { tool } from 'langchain'
import { z } from 'zod'

import { createUserSchema } from '../dto/create-user.dto'
import { deleteUsersSchema } from '../dto/delete-users.dto'
import { findUsersQuerySchema } from '../dto/find-users-query.dto'
import { updateUserSchema } from '../dto/update-user.dto'
import { updateUsersStatusSchema } from '../dto/update-users-status.dto'
import { UserService } from '../user.service'

const userIdSchema = z.object({
  id: z.string().min(1, 'User id is required')
})

const updateUserToolSchema = userIdSchema.extend(updateUserSchema.shape)

@Injectable()
export class UserTool {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

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

  getUserTool = tool(async ({ id }) => await this.userService.getUserInfoByUserId(id), {
    name: 'get_user',
    description: '根据用户 ID 查询单个用户详情',
    schema: userIdSchema
  })

  updateUserTool = tool(async ({ id, ...data }) => await this.userService.update(id, data), {
    name: 'update_user',
    description: '更新一个用户的信息',
    schema: updateUserToolSchema
  })

  restoreUsersTool = tool(async ({ ids }) => JSON.stringify(await this.userService.restore(ids)), {
    name: 'restore_users',
    description: '批量恢复已删除用户',
    schema: deleteUsersSchema
  })

  updateUsersStatusTool = tool(
    async (payload) => JSON.stringify(await this.userService.updateStatus(payload)),
    {
      name: 'update_users_status',
      description:
        '批量更新用户状态。状态规则：启用/激活账户时使用 active；禁用、停用、封禁、冻结账户时必须使用 suspended；inactive 仅表示账号未完成激活流程，不要用于管理员禁用账户；pending 表示待审核。',
      schema: updateUsersStatusSchema
    }
  )

  deleteUsersTool = tool(async ({ ids }) => JSON.stringify(await this.userService.remove(ids)), {
    name: 'delete_users',
    description: '软删除用户。该操作需要管理员审批通过后才能执行。',
    schema: deleteUsersSchema
  })

  hardDeleteUsersTool = tool(
    async ({ ids }) => JSON.stringify(await this.userService.hardRemove(ids)),
    {
      name: 'hard_delete_users',
      description: '彻底删除用户，并从数据库中永久删除。该高危操作需要管理员审批通过后才能执行。',
      schema: deleteUsersSchema
    }
  )

  getTools() {
    return [
      this.getUsersTool,
      this.createUserTool,
      this.getUserTool,
      this.updateUserTool,
      this.restoreUsersTool,
      this.updateUsersStatusTool,
      this.deleteUsersTool,
      this.hardDeleteUsersTool
    ]
  }
}
