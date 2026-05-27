import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { z } from 'zod'

import { findObjectByUserDataId } from '../lib/find-object-in-scene'
import { useBimStore } from '../stores/bim-store'

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

function toPositionTuple(position: z.infer<typeof positionSchema>): [number, number, number] {
  return [position.x, position.y, position.z]
}

/** 须在 <Canvas> 子树内调用，统一注册 BIM 相关 AI 前端工具 */
export function useBimSceneTools() {
  const scene = useThree((state) => state.scene)
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

  useFrontendTool({
    name: 'find_object',
    description: '根据 id 在 Three.js 场景中查找已加载的模型对象',
    parameters: z.object({
      id: z.string().describe('模型实例 id（load_model 返回的 id）')
    }),
    handler: async ({ id }) => {
      const object = findObjectByUserDataId(scene, id)

      if (!object) {
        return { status: 'error', message: `未找到 id 为「${id}」的对象` }
      }

      const worldPosition = new Vector3()
      object.getWorldPosition(worldPosition)
      const { url, position } = object.userData as {
        url?: string
        position?: [number, number, number]
      }

      return {
        status: 'success',
        message: '对象已找到',
        object: {
          id,
          name: object.name,
          url,
          position,
          worldPosition: [worldPosition.x, worldPosition.y, worldPosition.z] as [
            number,
            number,
            number
          ]
        }
      }
    }
  })
}
