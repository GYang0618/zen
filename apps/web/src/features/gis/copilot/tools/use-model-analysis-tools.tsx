import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { useCesium } from '../../cesium-provider'
import { findSceneModel, formatSceneModelGuide, GIS_SCENE_MODEL_ID_ENUM } from '../../constants'
import { analyzeDeployment } from '../../lib/analyze-deployment'
import { measureGlb } from '../../lib/glb-bounds'
import { catalogHeightMeters, realWorldSize } from '../../lib/model-real-size'

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
      '读取目录中的模型，返回对齐真实尺寸后的包围盒（米）。不要使用手写的长宽高，也不要据此再传一个很大的 scale。用户询问模型有多大、或部署前需要核对尺寸时调用。',
    parameters: z.object({ modelId: modelIdSchema }),
    handler: async ({ modelId }) => {
      const model = findSceneModel(modelId)
      if (!model) {
        return { status: 'error', message: `目录中没有模型 ${modelId}` }
      }
      try {
        const bounds = await measureGlb(model.uri)
        const [x, y, z] = realWorldSize(bounds, catalogHeightMeters(model))
        const radius = Math.hypot(x, y, z) / 2
        return {
          status: 'success',
          modelId: model.id,
          label: model.label,
          sizeMeters: {
            x: roundMeters(x),
            y: roundMeters(y),
            z: roundMeters(z)
          },
          radiusMeters: roundMeters(radius),
          message: `「${model.label}」真实尺寸 X ${roundMeters(x)} 米、Y ${roundMeters(y)} 米、Z ${roundMeters(z)} 米。Y 轴向上。部署时 scale 省略即可，1 表示这个真实尺寸。`
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
      scale: z
        .number()
        .optional()
        .describe('在真实尺寸上的均匀倍率，默认 1。不要为了看得更清而放大')
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
