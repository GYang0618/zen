import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { useThreeUtils } from '../../hooks/use-three-utils'
import { getObjectUserData } from '../../lib/object'

const findObjectToolSchema = z.object({
  condition: z.object({
    key: z.string().describe('userData 属性键'),
    value: z.string().describe('userData 属性值')
  })
})

export function useQueryObjectPropTool() {
  const { find } = useThreeUtils()

  useFrontendTool({
    name: 'find_object',
    description: '查询构件属性信息',
    parameters: findObjectToolSchema,
    handler: async ({ condition }) => {
      const { key, value } = condition
      const object = find((object) => {
        const userData = getObjectUserData(object)
        return key in userData && userData[key] === value
      })

      if (!object) {
        return { status: 'error', message: `未找到满足条件${key}为${value}的构件` }
      }

      console.log(getObjectUserData(object))

      return {
        status: 'success',
        message: '查询构件属性信息成功',
        data: getObjectUserData(object)
      }
    }
  })
}
