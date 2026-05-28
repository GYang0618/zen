import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useGLTF } from '@react-three/drei'
import { z } from 'zod'

import { useBimStore } from '../../stores/bim'

const positionSchema = z
  .object({
    x: z.number().optional().default(0).describe('X 轴平移（左右），米，左为正，右为负'),
    y: z.number().optional().default(0).describe('Y 轴平移（高度/抬高），米，抬高为正，降低为负'),
    z: z.number().optional().default(0).describe('Z 轴平移（前后），米，向前为正，向后为负')
  })
  .describe('相对原点中心的位置')

const loadModelToolSchema = z.object({
  url: z.url('模型URL必须是一个有效的URL'),
  position: positionSchema
})

function toPositionTuple(
  position: z.infer<typeof loadModelToolSchema>['position']
): [number, number, number] {
  return [position.x, position.y, position.z]
}

export function useLoadModelTool() {
  const addModelInstance = useBimStore((state) => state.addModelInstance)

  useFrontendTool({
    name: 'load_model',
    description: '向场景添加 GLB/GLTF 模型',
    parameters: loadModelToolSchema,
    handler: async ({ url, position }) => {
      try {
        useGLTF.preload(url)
        const id = addModelInstance({ url, position: toPositionTuple(position) })
        return { status: 'success', message: '模型已添加到场景', id }
      } catch (error) {
        return { status: 'error', message: '模型加载失败', error }
      }
    }
  })
}
