import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { useCesium } from '../../cesium-provider'
import { findSceneModel, formatSceneModelGuide, GIS_SCENE_MODEL_ID_ENUM } from '../../constants'
import { analyzeDeployment } from '../../lib/analyze-deployment'
import { measureGlb } from '../../lib/glb-bounds'

const modelIdSchema = z
  .enum(GIS_SCENE_MODEL_ID_ENUM)
  .describe(`目录中的模型 id。可选：${formatSceneModelGuide()}`)

const positionSchema = z.object({
  longitude: z.number().describe('部署经度（度）'),
  latitude: z.number().describe('部署纬度（度）'),
  height: z.number().optional().describe('锚点高程（米）。省略时贴地采样')
})

export function useModelAnalysisTools() {
  const { viewer } = useCesium()

  useFrontendTool({
    name: 'gis_analyze_model',
    description:
      '读取目录中的 GLB，测量真实包围盒和尺寸（米）。不要使用手写的长宽高。用户询问模型有多大、或部署前需要核对模型尺寸时调用。',
    parameters: z.object({ modelId: modelIdSchema }),
    handler: async ({ modelId }) => {
      const model = findSceneModel(modelId)
      if (!model) {
        return { status: 'error', message: `目录中没有模型 ${modelId}` }
      }
      try {
        const bounds = await measureGlb(model.uri)
        return {
          status: 'success',
          modelId: model.id,
          label: model.label,
          sizeMeters: {
            x: roundMeters(bounds.size[0]),
            y: roundMeters(bounds.size[1]),
            z: roundMeters(bounds.size[2])
          },
          radiusMeters: roundMeters(bounds.radius),
          message: `「${model.label}」实测尺寸 X ${roundMeters(bounds.size[0])} 米、Y ${roundMeters(bounds.size[1])} 米、Z ${roundMeters(bounds.size[2])} 米，包围球半径 ${roundMeters(bounds.radius)} 米。glTF 的 Y 轴向上。`
        }
      } catch (error) {
        return { status: 'error', message: errorMessage(error) }
      }
    },
    render: () => emptyToolRender()
  })

  useFrontendTool({
    name: 'gis_analyze_deploy_lod',
    description:
      '根据模型实测尺寸、部署位置和当前相机，计算包围盒、贴地偏移、几何误差，以及缩放到多近才会加载。不部署模型。',
    parameters: z.object({
      modelId: modelIdSchema,
      position: positionSchema,
      scale: z.number().optional().describe('在实测米制尺寸上的均匀缩放，默认 1')
    }),
    handler: async ({ modelId, position, scale }) => {
      try {
        const analysis = await analyzeDeployment(viewer, {
          modelId,
          longitude: position.longitude,
          latitude: position.latitude,
          height: position.height,
          scale
        })
        return {
          status: 'success',
          modelId: analysis.modelId,
          label: analysis.label,
          cellId: analysis.cellId,
          height: roundMeters(analysis.height),
          scale: analysis.scale,
          diameterMeters: roundMeters(analysis.diameterMeters),
          radiusMeters: roundMeters(analysis.radiusMeters),
          groundOffset: roundMeters(analysis.groundOffset),
          geometricError: roundMeters(analysis.geometricError),
          loadDistanceMeters: roundMeters(analysis.loadDistanceMeters),
          cameraDistanceMeters: roundMeters(analysis.cameraDistanceMeters),
          loadsAtCurrentView: analysis.loadsAtCurrentView,
          message: analysis.loadsAtCurrentView
            ? `「${analysis.label}」在当前视角下会加载。加载距离约 ${roundMeters(analysis.loadDistanceMeters)} 米。`
            : `「${analysis.label}」需要缩放到距离部署点约 ${roundMeters(analysis.loadDistanceMeters)} 米以内才会加载。当前相机距离约 ${roundMeters(analysis.cameraDistanceMeters)} 米。`
        }
      } catch (error) {
        return { status: 'error', message: errorMessage(error) }
      }
    },
    render: () => emptyToolRender()
  })
}

function roundMeters(value: number): number {
  return Math.round(value * 100) / 100
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '模型分析失败'
}
