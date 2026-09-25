import { useAgentContext } from '@copilotkit/react-core/v2'

import { useGisStore } from '../../stores/gis'

import type { GisPickedTarget } from '../../stores/gis'

function toPickedContext(target: GisPickedTarget) {
  const { longitude, latitude, height, modelId } = target
  const located =
    typeof longitude === 'number' && typeof latitude === 'number' && typeof height === 'number'
  return {
    id: target.id,
    kind: target.kind,
    name: target.name,
    ...(modelId ? { modelId } : {}),
    ...(located ? { longitude, latitude, height } : {})
  }
}

export function useInteractiveDataContext() {
  const markers = useGisStore((state) => state.markers)
  const deployedObjects = useGisStore((state) => state.deployedObjects)
  const pickedTargets = useGisStore((state) => state.pickedTargets)

  useAgentContext({
    description: '用户在三维 GIS 场景中标记的点位列表（包含点位ID、名称、经纬度和高程）',
    value: markers.map((m) => ({
      id: m.id,
      name: m.name,
      longitude: m.longitude,
      latitude: m.latitude,
      height: m.height
    }))
  })

  useAgentContext({
    description:
      '用户在三维场景中拾取选中的对象。id 是唯一身份：已部署模型用部署 id，实体用实体 id，图元用图元 id。操作这些对象时使用这里的 id，不要编造。',
    value: pickedTargets.map(toPickedContext)
  })

  useAgentContext({
    description:
      '场景中当前已部署的模型对象列表。loadDistanceMeters 是缩放到该距离内才会加载模型的距离。',
    value: deployedObjects.map((object) => ({
      id: object.id,
      name: object.name,
      modelId: object.modelId,
      longitude: object.longitude,
      latitude: object.latitude,
      height: object.height,
      loadDistanceMeters: object.loadDistanceMeters
    }))
  })
}
