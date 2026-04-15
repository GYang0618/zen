import { Injectable } from '@nestjs/common'
import { ToolRuntime, tool } from 'langchain'

import { findUsersQuerySchema } from '../dto/find-users-query.dto'
import { UserService } from '../user.service'

@Injectable()
export class UserTool {
  constructor(private userService: UserService) {}

  getUsersTool = tool(
    async (input, config: ToolRuntime) => {
      config.writer?.({
        type: 'status',
        id: `status-${Date.now()}`,
        status: 'complete',
        message: 'Analysis finished'
      })

      return this.userService.findAll(input)
    },
    {
      name: 'get_user_info',
      description: '查询用户信息，支持关键字（邮箱、用户名、昵称、手机号）、分页查询',
      schema: findUsersQuerySchema
    }
  )

  getTools() {
    return [this.getUsersTool]
  }
}
