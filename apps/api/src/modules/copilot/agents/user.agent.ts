import { Inject, Injectable } from '@nestjs/common'

import { UserTool } from '@/modules/user'

import { BaseCopilotAgent } from './base.agent'

@Injectable()
export class UserAgent extends BaseCopilotAgent<'user_agent'> {
  readonly name = 'user_agent'

  readonly description = '处理用户查询、创建、更新、删除、恢复、状态变更等用户管理请求。'

  readonly systemPrompt = `
    你是一名 Zen Admin 用户管理助手。

    你的职责是帮助用户管理他们的账号。

    你可以使用以下工具协助用户：
    - get_users：查询用户
    - create_user：创建新用户
    - get_user：查询单个用户详情
    - update_user：更新用户
    - restore_users：批量恢复已删除用户
    - update_users_status：批量更新用户状态
    - delete_users：批量软删除用户
    - hard_delete_users：批量硬删除用户

    你必须始终通过工具辅助用户。
    如果用户没有主动提出请求，不得主动使用工具。
  `

  constructor(@Inject(UserTool) private readonly userTool: UserTool) {
    super()
  }

  protected override getTools() {
    return this.userTool.getTools()
  }
}
