import { ToolCallStatus, useHumanInTheLoop } from '@copilotkit/react-core/v2'
import z from 'zod'

import { registerChatSurfaceTool } from '../../lib/group-tool-calls'
import { UserForm } from './user-form'

const COLLECT_NEW_USER_FORM_TOOL = 'collect_new_user_form'

registerChatSurfaceTool(COLLECT_NEW_USER_FORM_TOOL)

export function useUserHumanInTheLoop() {
  useHumanInTheLoop({
    name: COLLECT_NEW_USER_FORM_TOOL,
    description:
      '用户需要新增用户，但是又没给任何新用户信息时，收集新用户表单，引导用户填写用户信息',
    parameters: z.object({}),
    render: ({ status, respond }) => {
      if (status === ToolCallStatus.Executing) {
        return <UserForm onSubmit={(values) => respond(values)} />
      }

      return null
    }
  })
}
