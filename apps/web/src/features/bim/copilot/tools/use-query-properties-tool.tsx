import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { bimMeshRegistry } from '../../lib/mesh-registry'
import { getObjectUserData } from '../../lib/object'
import { ObjectPropertiesCard } from '../components/object-properties-card'

const findObjectToolSchema = z.object({
  id: z.string().describe('构件id')
})

const PropertiesDataSchema = z.record(z.string(), z.any()).describe('构件属性信息')

export function useQueryPropertiesTool() {
  useFrontendTool({
    name: 'query_properties',
    description: `查询构件属性信息`,
    parameters: findObjectToolSchema,
    handler: async ({ id }) => {
      const object = bimMeshRegistry.get(id)
      if (!object) {
        return { status: 'error', message: `未找到该构件（id: ${id}）` }
      }
      const userData = getObjectUserData(object)
      return {
        status: 'success',
        message: '查询构件属性信息成功。',
        data: userData
      }
    },
    render: ({ result }) => {
      if (!result) return null
      const data = PropertiesDataSchema.parse(JSON.parse(result).data)
      return <ObjectPropertiesCard data={data} />
    }
  })
}
