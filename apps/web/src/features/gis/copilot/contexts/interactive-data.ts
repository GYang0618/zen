import { useAgentContext } from '@copilotkit/react-core/v2'

import { useGisStore } from '../../stores/gis'

export function useInteractiveDataContext() {
  const markers = useGisStore((state) => state.markers)
  const deployedObjects = useGisStore((state) => state.deployedObjects)

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
    description: '场景中当前已部署的模型对象列表',
    value: deployedObjects.map((o) => ({
      id: o.id,
      name: o.name,
      category: o.category,
      longitude: o.longitude,
      latitude: o.latitude,
      height: o.height
    }))
  })
}
