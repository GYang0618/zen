import { Button } from '@zen/ui'
import { X } from 'lucide-react'

import { useCesium } from '../cesium-provider'
import { findSceneModel } from '../constants'
import {
  flyToDeployedObject,
  flyToMarker,
  formatCoordinates,
  formatDistance
} from '../lib/geo-utils'
import { useGisStore } from '../stores/gis'

import type { Viewer } from 'cesium'
import type { ReactNode } from 'react'
import type { GisDeployedObject, GisMarker, GisPickedKind, GisPickedTarget } from '../stores/gis'

const PICKED_KIND_LABELS: Record<GisPickedKind, string> = {
  'deployed-model': '模型',
  entity: '实体',
  'tile-feature': '图元',
  primitive: '图元'
}

export function PickedList() {
  const pickedTargets = useGisStore((state) => state.pickedTargets)
  const removePickedTarget = useGisStore((state) => state.removePickedTarget)

  if (pickedTargets.length === 0) {
    return <ListEmpty>暂无选中。激活「实体拾取」后点击、Shift 多选或 Alt 框选</ListEmpty>
  }

  return (
    <ListBody>
      {pickedTargets.map((target) => (
        <PickedRow key={target.id} target={target} onRemove={removePickedTarget} />
      ))}
    </ListBody>
  )
}

function PickedRow({
  target,
  onRemove
}: {
  target: GisPickedTarget
  onRemove: (id: string) => void
}) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/40 px-2.5 py-1.5">
      <div className="flex min-w-0 flex-1 flex-col pr-2">
        <span className="truncate font-medium text-foreground">
          {PICKED_KIND_LABELS[target.kind]} · {target.name}
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground">{target.id}</span>
      </div>
      <RemoveButton title="取消选中" onClick={() => onRemove(target.id)} />
    </li>
  )
}

export function MarkerList() {
  const { viewer } = useCesium()
  const markers = useGisStore((state) => state.markers)
  const removeMarker = useGisStore((state) => state.removeMarker)

  if (markers.length === 0) {
    return <ListEmpty>暂无标记点，可点击「标记点位」在场景中打点</ListEmpty>
  }

  return (
    <ListBody>
      {markers.map((marker, index) => (
        <MarkerRow
          key={marker.id}
          index={index}
          marker={marker}
          viewer={viewer}
          onRemove={removeMarker}
        />
      ))}
    </ListBody>
  )
}

function MarkerRow({
  index,
  marker,
  viewer,
  onRemove
}: {
  index: number
  marker: GisMarker
  viewer: Viewer | null
  onRemove: (id: string) => void
}) {
  return (
    <li className="group flex items-center justify-between rounded-xl border border-border/50 bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/70">
      <button
        type="button"
        onClick={() => {
          if (viewer) flyToMarker(viewer, marker)
        }}
        title="点击定位到该点位"
        className="flex flex-1 flex-col overflow-hidden pr-2 text-left focus:outline-none"
      >
        <span className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
          {index + 1}. {marker.name}
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {formatCoordinates(marker.longitude, marker.latitude, marker.height)}
        </span>
      </button>
      <RemoveButton title="删除此标记" onClick={() => onRemove(marker.id)} />
    </li>
  )
}

export function DeployedList() {
  const { viewer } = useCesium()
  const deployedObjects = useGisStore((state) => state.deployedObjects)
  const removeDeployedObject = useGisStore((state) => state.removeDeployedObject)

  if (deployedObjects.length === 0) {
    return <ListEmpty>暂无部署模型。让助手在场景中放置模型后，会出现在这里</ListEmpty>
  }

  return (
    <ListBody>
      {deployedObjects.map((object, index) => (
        <DeployedRow
          key={object.id}
          index={index}
          object={object}
          viewer={viewer}
          onRemove={removeDeployedObject}
        />
      ))}
    </ListBody>
  )
}

function DeployedRow({
  index,
  object,
  viewer,
  onRemove
}: {
  index: number
  object: GisDeployedObject
  viewer: Viewer | null
  onRemove: (id: string) => void
}) {
  return (
    <li className="group flex items-center justify-between rounded-xl border border-border/50 bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/70">
      <button
        type="button"
        onClick={() => {
          if (viewer) flyToDeployedObject(viewer, object)
        }}
        title="点击飞到该模型"
        className="flex flex-1 flex-col overflow-hidden pr-2 text-left focus:outline-none"
      >
        <span className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
          {index + 1}. {object.name}
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {findSceneModel(object.modelId)?.label ?? object.modelId}
          {' · '}
          {formatDistance(object.loadDistanceMeters)} 内加载
        </span>
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          {formatCoordinates(object.longitude, object.latitude, object.height)}
        </span>
      </button>
      <RemoveButton title="移除该模型" onClick={() => onRemove(object.id)} />
    </li>
  )
}

function ListBody({ children }: { children: ReactNode }) {
  return <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">{children}</ul>
}

function ListEmpty({ children }: { children: string }) {
  return <div className="py-6 text-center text-xs text-muted-foreground">{children}</div>
}

function RemoveButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
    >
      <X className="size-3" />
    </Button>
  )
}
