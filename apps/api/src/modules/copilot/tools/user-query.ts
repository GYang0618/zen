import { tool } from 'langchain'
import z from 'zod'

import { UserService } from '@/modules/user'

export const createUserQueryTool = (userService: UserService) => {
  return tool(
    async ({ id }) => {
      console.log('🚀 ~ createUserQueryTool ~ id:', id)

      // if (id) {
      //   const user = await userService.getUserInfoByUserId(id)
      //   return JSON.stringify(user)
      // }
      // const users = await userService.findAll()
      // return JSON.stringify(users)

      return '用户查询数据'
    },
    {
      name: 'user_query',
      description: '查询用户列表数据,或者根据指定id查询用户列表数据',
      schema: z.object({
        id: z.string().describe('用户id').optional()
      })
    }
  )
}
