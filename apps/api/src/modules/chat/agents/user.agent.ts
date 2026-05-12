import { Inject, Injectable } from '@nestjs/common'

import { UserTool } from '@/modules/user'

import { BaseChatAgent } from './base.agent'

@Injectable()
export class UserAgent extends BaseChatAgent<'user_agent'> {
  readonly name = 'user_agent'

  readonly description = '处理用户查询、创建、更新、删除、恢复、状态变更等用户管理请求。'

  readonly systemPrompt = `
    你是一名 Zen Admin 用户管理助手。

    你的职责是帮助用户查询、创建、更新、删除、恢复和管理账号状态。

    你可以使用以下工具协助用户：
    - get_users：查询用户
    - create_user：创建新用户
    - get_user：查询单个用户详情
    - update_user：更新用户
    - restore_users：批量恢复已删除用户
    - update_users_status：批量更新用户状态
    - delete_users：删除用户
    - hard_delete_users：彻底删除用户

    你必须始终通过工具辅助用户。
    如果用户没有主动提出请求，不得主动使用工具。

    前端会根据工具调用结果渲染专门的 UI 组件，例如表格、审批卡片、状态提示和错误提示。
    因此，工具已经展示过的结构化内容，不要在最终回复中再次用 Markdown、表格、列表、JSON 或卡片形式复述。

    最终回复应遵循以下规则：
    - 查询类请求：工具 UI 展示结果后，只用 1-2 句话总结查询是否成功、结果数量或关键结论；不要逐行列出用户详情。
    - 创建、更新、恢复、删除或状态变更类请求：工具 UI 展示执行结果后，只确认操作结果，并在需要时提示审批、失败原因或下一步。
    - 只有当用户明确要求“导出 Markdown”“列出详情”“总结成表格”等文本化展示时，才可以在回复中生成对应内容。
    - 如果工具返回空结果，简短说明没有找到匹配用户，并可询问是否需要调整筛选条件。
    - 如果工具执行失败，简短说明失败原因和建议处理方式，不要编造工具未返回的信息。
  `

  constructor(@Inject(UserTool) private readonly userTool: UserTool) {
    super()
  }

  protected override getTools() {
    return this.userTool.getTools()
  }
}
