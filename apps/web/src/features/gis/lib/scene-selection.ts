import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Cesium3DTileFeature,
  Cesium3DTileset,
  Math as CesiumMath,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  defined,
  SceneTransforms
} from 'cesium'

import { GIS_DEPLOY_OBJECT_EXTRA_KEY } from './build-deploy-tileset'
import { TILE_FEATURE_HIGHLIGHT } from './tileset-highlight'

import type { Cesium3DTile, Cesium3DTileContent, Entity, JulianDate, Model, Viewer } from 'cesium'
import type { GisDeployedObject, GisPickedTarget } from '../stores/gis'

const SILHOUETTE_SIZE_PX = 3
const BOX_SAMPLE_STEP_PX = 24
const BOX_DRAG_THRESHOLD_PX = 4
const DRILL_PICK_LIMIT = 8

const HIGHLIGHT_COLOR = Color.fromCssColorString('#00e5ff')

export type ScreenRect = {
  left: number
  top: number
  width: number
  height: number
}

type HighlightSlot = {
  restore: () => void
}

const highlightSlots = new Map<string, HighlightSlot>()
const featureById = new Map<string, Cesium3DTileFeature>()

export function describeScenePick(
  picked: unknown,
  deployedObjects: readonly GisDeployedObject[],
  time: JulianDate
): GisPickedTarget | undefined {
  if (!picked || typeof picked !== 'object') return undefined
  if (picked instanceof Cesium3DTileFeature) return describeTileFeature(picked)

  const record = picked as {
    id?: unknown
    content?: Cesium3DTileContent
    detail?: { model?: Model }
  }

  if (isEntity(record.id)) return describeEntity(record.id, time)
  const objectId = readTileObjectId(record.content?.tile)
  if (objectId) return describeDeployed(objectId, deployedObjects)
  return undefined
}

export function collectTargetsInRectangle(
  viewer: Viewer,
  start: Cartesian2,
  end: Cartesian2,
  deployedObjects: readonly GisDeployedObject[]
): GisPickedTarget[] {
  const rect = normalizeRect(start, end)
  const byId = new Map<string, GisPickedTarget>()
  const time = viewer.clock.currentTime

  for (const entity of viewer.entities.values) {
    const windowPosition = projectCartesian(viewer, entityCartesian(entity, time))
    if (!windowPosition || !rectContains(rect, windowPosition)) continue
    byId.set(String(entity.id), describeEntity(entity, time))
  }

  for (const object of deployedObjects) {
    const anchor = Cartesian3.fromDegrees(
      object.longitude,
      object.latitude,
      object.height + object.groundOffset
    )
    const windowPosition = projectCartesian(viewer, anchor)
    if (!windowPosition || !rectContains(rect, windowPosition)) continue
    byId.set(object.id, describeDeployed(object.id, deployedObjects))
  }

  for (const sample of samplePoints(rect)) {
    for (const picked of viewer.scene.drillPick(sample, DRILL_PICK_LIMIT)) {
      const target = describeScenePick(picked, deployedObjects, time)
      if (target) byId.set(target.id, target)
    }
  }

  return [...byId.values()]
}

export function toScreenRect(start: Cartesian2, end: Cartesian2): ScreenRect {
  return normalizeRect(start, end)
}

export function rectFromDrag(start: Cartesian2, end: Cartesian2): ScreenRect | undefined {
  const rect = normalizeRect(start, end)
  if (rect.width < BOX_DRAG_THRESHOLD_PX && rect.height < BOX_DRAG_THRESHOLD_PX) return undefined
  return rect
}

export function syncSelectionHighlight(
  viewer: Viewer,
  targets: readonly GisPickedTarget[],
  deployedIds: ReadonlySet<string>
): void {
  const selected = new Set(
    targets
      .filter((target) => target.kind !== 'deployed-model' || deployedIds.has(target.id))
      .map((target) => target.id)
  )
  for (const [id, slot] of highlightSlots) {
    if (selected.has(id)) continue
    slot.restore()
    highlightSlots.delete(id)
    featureById.delete(id)
  }

  for (const target of targets) {
    if (!selected.has(target.id) || highlightSlots.has(target.id)) continue
    const slot = createHighlight(viewer, target)
    if (slot) highlightSlots.set(target.id, slot)
  }
  viewer.scene.requestRender()
}

export function clearSelectionHighlight(viewer: Viewer): void {
  for (const slot of highlightSlots.values()) slot.restore()
  highlightSlots.clear()
  featureById.clear()
  if (!viewer.isDestroyed()) viewer.scene.requestRender()
}

function describeEntity(entity: Entity, time: JulianDate): GisPickedTarget {
  const cartographic = readCartographic(entityCartesian(entity, time))
  return {
    id: String(entity.id),
    kind: 'entity',
    name: entity.name?.trim() || '场景实体',
    ...cartographic
  }
}

function describeDeployed(
  objectId: string,
  deployedObjects: readonly GisDeployedObject[]
): GisPickedTarget {
  const object = deployedObjects.find((item) => item.id === objectId)
  if (!object) {
    return { id: objectId, kind: 'deployed-model', name: '已部署模型' }
  }
  return {
    id: object.id,
    kind: 'deployed-model',
    name: object.name,
    modelId: object.modelId,
    longitude: object.longitude,
    latitude: object.latitude,
    height: object.height
  }
}

function describeTileFeature(feature: Cesium3DTileFeature): GisPickedTarget {
  const id = tileFeatureId(feature)
  featureById.set(id, feature)
  const nameProperty = readFeatureName(feature)
  return {
    id,
    kind: 'tile-feature',
    name: nameProperty ?? `图元 ${feature.featureId}`
  }
}

function tileFeatureId(feature: Cesium3DTileFeature): string {
  for (const key of ['id', 'objectId', GIS_DEPLOY_OBJECT_EXTRA_KEY, 'name']) {
    if (!feature.hasProperty(key)) continue
    const value = feature.getProperty(key)
    if (typeof value === 'string' && value) return value
    if (typeof value === 'number') return String(value)
  }
  return `tile-feature:${feature.tileset.basePath}:${feature.featureId}`
}

function readFeatureName(feature: Cesium3DTileFeature): string | undefined {
  if (!feature.hasProperty('name')) return undefined
  const value = feature.getProperty('name')
  return typeof value === 'string' && value ? value : undefined
}

function createHighlight(viewer: Viewer, target: GisPickedTarget): HighlightSlot | undefined {
  if (target.kind === 'entity') return highlightEntity(viewer.entities.getById(target.id))
  if (target.kind === 'deployed-model') return highlightModel(findDeployedModel(viewer, target.id))
  if (target.kind === 'tile-feature') return highlightFeature(featureById.get(target.id))
  return undefined
}

function highlightEntity(entity: Entity | undefined): HighlightSlot | undefined {
  if (!entity) return undefined
  const restores: Array<() => void> = []
  highlightEntityModel(entity, restores)
  highlightEntityPolyline(entity, restores)
  highlightEntityPoint(entity, restores)
  if (restores.length === 0) return undefined
  return {
    restore: () => {
      for (const restore of restores) restore()
    }
  }
}

function highlightEntityModel(entity: Entity, restores: Array<() => void>): void {
  const model = entity.model
  if (!model) return
  const previousColor = model.silhouetteColor
  const previousSize = model.silhouetteSize
  model.silhouetteColor = new ConstantProperty(HIGHLIGHT_COLOR)
  model.silhouetteSize = new ConstantProperty(SILHOUETTE_SIZE_PX)
  restores.push(() => {
    model.silhouetteColor = previousColor
    model.silhouetteSize = previousSize
  })
}

function highlightEntityPolyline(entity: Entity, restores: Array<() => void>): void {
  const polyline = entity.polyline
  if (!polyline) return
  const previousMaterial = polyline.material
  const previousWidth = polyline.width
  polyline.material = new ColorMaterialProperty(HIGHLIGHT_COLOR)
  restores.push(() => {
    polyline.material = previousMaterial
    polyline.width = previousWidth
  })
}

function highlightEntityPoint(entity: Entity, restores: Array<() => void>): void {
  const point = entity.point
  const billboard = entity.billboard
  if (point) {
    const previousColor = point.color
    point.color = new ConstantProperty(HIGHLIGHT_COLOR)
    restores.push(() => {
      point.color = previousColor
    })
  }
  if (billboard) {
    const previousColor = billboard.color
    billboard.color = new ConstantProperty(HIGHLIGHT_COLOR)
    restores.push(() => {
      billboard.color = previousColor
    })
  }
}

function highlightModel(model: Model | undefined): HighlightSlot | undefined {
  if (!model || model.isDestroyed()) return undefined
  const previousColor = Color.clone(model.silhouetteColor)
  const previousSize = model.silhouetteSize
  model.silhouetteColor = Color.clone(HIGHLIGHT_COLOR)
  model.silhouetteSize = SILHOUETTE_SIZE_PX
  return {
    restore: () => {
      if (model.isDestroyed()) return
      model.silhouetteColor = previousColor
      model.silhouetteSize = previousSize
    }
  }
}

function highlightFeature(feature: Cesium3DTileFeature | undefined): HighlightSlot | undefined {
  if (!feature) return undefined
  const original = Color.clone(feature.color)
  feature.color = Color.clone(TILE_FEATURE_HIGHLIGHT, feature.color)
  return {
    restore: () => {
      feature.color = Color.clone(original, feature.color)
    }
  }
}

function findDeployedModel(viewer: Viewer, objectId: string): Model | undefined {
  const primitives = viewer.scene.primitives
  for (let index = 0; index < primitives.length; index += 1) {
    const primitive = primitives.get(index)
    if (!(primitive instanceof Cesium3DTileset) || !primitive.root) continue
    const model = findModelInTile(primitive.root, objectId)
    if (model) return model
  }
  return undefined
}

function findModelInTile(tile: Cesium3DTile, objectId: string): Model | undefined {
  if (readTileObjectId(tile) === objectId) {
    const model = readContentModel(tile.content)
    if (model) return model
  }
  for (const child of tile.children) {
    const model = findModelInTile(child, objectId)
    if (model) return model
  }
  return undefined
}

function readTileObjectId(tile: Cesium3DTile | undefined): string | undefined {
  const extras = tile?.extras
  if (!extras || typeof extras !== 'object') return undefined
  const objectId = extras[GIS_DEPLOY_OBJECT_EXTRA_KEY]
  return typeof objectId === 'string' && objectId ? objectId : undefined
}

/** Cesium 的瓦片内容类型没有公开 Model。运行时实例挂在 content 上，和拾取结果 detail.model 是同一个。 */
function readContentModel(content: Cesium3DTileContent | undefined): Model | undefined {
  if (!content?.ready || !isRecord(content)) return undefined
  const model = content._model
  return isModel(model) ? model : undefined
}

function isModel(value: unknown): value is Model {
  return isRecord(value) && typeof value.silhouetteSize === 'number' && 'boundingSphere' in value
}

function isEntity(value: unknown): value is Entity {
  return isRecord(value) && 'entityCollection' in value && 'id' in value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function entityCartesian(entity: Entity, time: JulianDate): Cartesian3 | undefined {
  const position = entity.position?.getValue(time)
  if (defined(position)) return position
  const positions = entity.polyline?.positions?.getValue(time)
  if (!positions || positions.length === 0) return undefined
  return positions[Math.floor(positions.length / 2)]
}

function readCartographic(
  cartesian: Cartesian3 | undefined
): Pick<GisPickedTarget, 'longitude' | 'latitude' | 'height'> | undefined {
  if (!cartesian) return undefined
  const cartographic = Cartographic.fromCartesian(cartesian)
  return {
    longitude: Number(CesiumMath.toDegrees(cartographic.longitude).toFixed(6)),
    latitude: Number(CesiumMath.toDegrees(cartographic.latitude).toFixed(6)),
    height: Number((cartographic.height ?? 0).toFixed(2))
  }
}

function projectCartesian(
  viewer: Viewer,
  cartesian: Cartesian3 | undefined
): Cartesian2 | undefined {
  if (!cartesian) return undefined
  return SceneTransforms.worldToWindowCoordinates(viewer.scene, cartesian)
}

function normalizeRect(start: Cartesian2, end: Cartesian2): ScreenRect {
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  return {
    left,
    top,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  }
}

function rectContains(rect: ScreenRect, point: Cartesian2): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  )
}

function samplePoints(rect: ScreenRect): Cartesian2[] {
  const points: Cartesian2[] = []
  const columns = Math.max(1, Math.ceil(rect.width / BOX_SAMPLE_STEP_PX))
  const rows = Math.max(1, Math.ceil(rect.height / BOX_SAMPLE_STEP_PX))
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      points.push(
        new Cartesian2(
          rect.left + (rect.width * column) / columns,
          rect.top + (rect.height * row) / rows
        )
      )
    }
  }
  return points
}
