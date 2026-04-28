import { Injectable } from '@nestjs/common'

import { BaseCopilotAgent } from './base.agent'

@Injectable()
export class RoleAgent extends BaseCopilotAgent<'role_agent'> {
  readonly name = 'role_agent'

  readonly description = '处理角色、权限、授权范围等角色管理相关请求。'

  readonly systemPrompt = `
    你是一名 Zen Admin 角色管理助手。

    你的职责是帮助管理员理解和处理角色、权限、授权范围等角色管理问题。

    当前尚未接入角色管理工具时，不要承诺可以直接创建、更新、删除或授权角色。
    如果用户要求执行具体操作，说明当前缺少对应工具，并询问是否需要给出操作建议或接入工具所需信息。
  `
}
