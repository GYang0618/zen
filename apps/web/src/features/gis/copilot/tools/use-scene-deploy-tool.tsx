import { useFrontendTool } from '@copilotkit/react-core/v2'
import { toast } from '@zen/ui'
import { z } from 'zod'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

import { useCesium } from '../../cesium-provider'
import {
  findSceneModel,
  formatSceneModelGuide,
  formatSceneModelVariantGuide,
  GIS_SCENE_MODEL_ID_ENUM,
  GIS_SCENE_MODEL_VARIANT_CATEGORY_ENUM,
  pickSceneModelInCategory
} from '../../constants'
import { analyzeDeployment } from '../../lib/analyze-deployment'
import { flyToDeployedObject, formatCoordinates } from '../../lib/geo-utils'
import { useGisStore } from '../../stores/gis'

const sceneDeploySchema = z.object({
  modelId: z
    .enum(GIS_SCENE_MODEL_ID_ENUM)
    .optional()
    .describe(
      `具体模型 id。用户点名了款式才传；只说类别时省略，改传 category。可选：${formatSceneModelGuide()}`
    ),
  category: z
    .enum(GIS_SCENE_MODEL_VARIANT_CATEGORY_ENUM)
    .optional()
    .describe(
      `多款式类别。用户只说类别、没点名具体款式时只传这个，不要传 modelId。${formatSceneModelVariantGuide()}`
    ),
  targetMarker: z
    .string()
    .optional()
    .describe('目标标记点的名称或 ID。用户指定在某个标记点部署时优先填入'),
  position: z
    .object({
      longitude: z.number().describe('经度（度）'),
      latitude: z.number().describe('纬度（度）'),
      height: z.number().optional().describe('高度（米）。省略时贴地')
    })
    .optional()
    .describe('部署点的经纬度。未指定 targetMarker 时使用'),
  name: z.string().optional().describe('该实例的自定义名称'),
  heading: z.number().optional().describe('航向角（度，正北为 0）'),
  scale: z.number().optional().describe('在 GLB 实测米制尺寸上的均匀缩放，默认 1')
})

export function useSceneDeployTool() {
  const { viewer } = useCesium()

  useFrontendTool({
    name: 'gis_scene_deploy',
    description: `在三维场景中部署目录里的任意 GLB。尺寸、包围盒和加载距离会按模型文件、部署位置和当前场景自动计算，缩放到加载距离内才请求模型。可选模型：${formatSceneModelGuide()}。${formatSceneModelVariantGuide()}`,
    parameters: sceneDeploySchema,
    handler: async ({ modelId, category, targetMarker, position, name, heading, scale }) => {
      const model = modelId
        ? findSceneModel(modelId)
        : category
          ? pickSceneModelInCategory(category)
          : undefined
      if (!model) {
        const message = modelId
          ? `目录中没有模型 ${modelId}`
          : category
            ? `目录中没有类别 ${category}`
            : '请传入 modelId 或 category'
        return { status: 'error', message }
      }

      const anchor = resolveAnchor(targetMarker, position)
      if (!anchor) {
        return {
          status: 'error',
          message: '未找到部署位置：请指定经纬度，或先使用底部 Dock 的「标记点位」在地图上打点。'
        }
      }

      try {
        const analysis = await analyzeDeployment(viewer, {
          modelId: model.id,
          longitude: anchor.longitude,
          latitude: anchor.latitude,
          height: anchor.height,
          heading,
          scale
        })
        const objectName = name || `${model.label}（${anchor.referenceName || '点位'}）`
        const deployed = useGisStore.getState().addDeployedObject({
          name: objectName,
          modelId: analysis.modelId,
          modelUri: analysis.modelUri,
          longitude: analysis.longitude,
          latitude: analysis.latitude,
          height: analysis.height,
          heading: analysis.heading,
          scale: analysis.scale,
          cellId: analysis.cellId,
          geometricError: analysis.geometricError,
          loadDistanceMeters: analysis.loadDistanceMeters,
          groundOffset: analysis.groundOffset,
          diameterMeters: analysis.diameterMeters,
          radiusMeters: analysis.radiusMeters,
          bounds: analysis.bounds
        })

        flyToDeployedObject(viewer, deployed)
        const coordStr = formatCoordinates(analysis.longitude, analysis.latitude, analysis.height)
        toast.add({ title: `已在场景部署「${objectName}」`, type: 'success' })

        return {
          status: 'success',
          message: `已部署「${objectName}」。实测直径 ${analysis.diameterMeters.toFixed(2)} 米，约 ${analysis.loadDistanceMeters.toFixed(0)} 米内才会加载。位置：${coordStr}。`,
          deployedObject: {
            id: deployed.id,
            name: deployed.name,
            modelId: deployed.modelId,
            loadDistanceMeters: analysis.loadDistanceMeters,
            loadsAtCurrentView: analysis.loadsAtCurrentView
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '部署失败'
        return { status: 'error', message }
      }
    },
    render: () => emptyToolRender()
  })
}

function resolveAnchor(
  targetMarker: string | undefined,
  position: { longitude: number; latitude: number; height?: number } | undefined
): { longitude: number; latitude: number; height?: number; referenceName: string } | null {
  const storedMarkers = useGisStore.getState().markers
  if (targetMarker) {
    const found = storedMarkers.find(
      (marker) =>
        marker.name.toLowerCase() === targetMarker.toLowerCase() ||
        marker.name.includes(targetMarker) ||
        marker.id === targetMarker
    )
    if (found) {
      return {
        longitude: found.longitude,
        latitude: found.latitude,
        height: found.height,
        referenceName: found.name
      }
    }
  }

  if (position) {
    return { ...position, referenceName: '' }
  }

  const latest = storedMarkers[storedMarkers.length - 1]
  if (!latest) return null
  return {
    longitude: latest.longitude,
    latitude: latest.latitude,
    height: latest.height,
    referenceName: latest.name
  }
}
