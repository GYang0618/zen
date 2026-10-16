import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian3,
  Math as CesiumMath,
  ConstantProperty,
  Ellipsoid,
  HeightReference,
  Matrix3,
  Matrix4,
  NodeTransformationProperty,
  PropertyBag,
  Quaternion,
  Transforms
} from 'cesium'

import { GIS_MODEL_PATHS, GIS_ROAM_CONFIG } from '../../constants'

import type { Entity, Viewer } from 'cesium'
import type { GisRoamViewMode } from '../../constants'
import type { GisRoamVehicle } from '../../stores/gis-roam'

const ROAM_MODEL_MIN_PIXEL_SIZE = 64
const ROAM_MODEL_MAX_SCALE = 100

const scratchMatrix3 = new Matrix3()
const scratchMatrix4 = new Matrix4()
const scratchOrientation = new Quaternion()
const scratchRotation = new Quaternion()

export type RoamVehicleConfig = (typeof GIS_ROAM_CONFIG)[GisRoamVehicle]

export interface RoamModelPrimitive {
  id?: Entity
  modelMatrix: Matrix4
  isDestroyed?: () => boolean
}

export interface NodePose {
  translation: Cartesian3
  rotation: Quaternion
  scale: Cartesian3
}

/** 车轮枢轴绕局部 +X 转。与 glTF Wheel_Roll 同轴，转角由行驶距离决定。 */
export const vehicleWheelSpin: NodePose = {
  translation: new Cartesian3(0, 0, 0),
  rotation: new Quaternion(),
  scale: new Cartesian3(1, 1, 1)
}

export const vehicleWheelNodes = liveNodeTransformations({
  Wheel_FL_Pivot: vehicleWheelSpin,
  Wheel_FR_Pivot: vehicleWheelSpin,
  Wheel_BL_Pivot: vehicleWheelSpin,
  Wheel_BR_Pivot: vehicleWheelSpin
})

/** 机体局部轴：+X 前、+Y 左、+Z 上。偏航绕上轴，俯仰绕左轴，坡度绕前轴。 */
export const modelAxisForward = new Cartesian3(1, 0, 0)
export const modelAxisLeft = new Cartesian3(0, 1, 0)
export const modelAxisUp = new Cartesian3(0, 0, 1)

export function getModelUri(vehicle: GisRoamVehicle): string {
  switch (vehicle) {
    case 'walk':
      return GIS_MODEL_PATHS.pedestrian
    case 'vehicle':
      return GIS_MODEL_PATHS.vehicle
    case 'plane':
      return GIS_MODEL_PATHS.airplane
    case 'fighter':
      return GIS_MODEL_PATHS.fighter
  }
}

export function isAirVehicle(vehicle: GisRoamVehicle): boolean {
  return vehicle === 'plane' || vehicle === 'fighter'
}

/**
 * ModelGraphics 会把 nodeTransformations 收成 PropertyBag，并按对象的键当成节点名。
 * 整包 CallbackProperty 的键是内部字段，关节不会被应用到模型。
 * 每个平移、旋转、缩放单独用回调读当前姿态，Cesium 才会每帧取样。
 */
export function liveNodeTransformations(nodes: Record<string, NodePose>) {
  return new PropertyBag(
    Object.fromEntries(
      Object.entries(nodes).map(([name, pose]) => [
        name,
        new NodeTransformationProperty({
          translation: new CallbackProperty((_time, result) => {
            return Cartesian3.clone(
              pose.translation,
              result instanceof Cartesian3 ? result : new Cartesian3()
            )
          }, false),
          rotation: new CallbackProperty((_time, result) => {
            return Quaternion.clone(
              pose.rotation,
              result instanceof Quaternion ? result : new Quaternion()
            )
          }, false),
          scale: new CallbackProperty((_time, result) => {
            return Cartesian3.clone(
              pose.scale,
              result instanceof Cartesian3 ? result : new Cartesian3()
            )
          }, false)
        })
      ])
    )
  )
}

/** 空投模型的上轴对齐当地法线。glTF 的 +Y 经 Cesium 轴修正后是模型 +Z。 */
export function syncAirdropOrientation(position: Cartesian3, orientation: Quaternion) {
  const enu = Transforms.eastNorthUpToFixedFrame(position, Ellipsoid.WGS84, scratchMatrix4)
  Matrix4.getMatrix3(enu, scratchMatrix3)
  Quaternion.fromRotationMatrix(scratchMatrix3, orientation)
}

export function isRoamModelPrimitive(value: unknown, entity: Entity): value is RoamModelPrimitive {
  if (typeof value !== 'object' || value === null) return false
  if (!('modelMatrix' in value) || !('id' in value)) return false
  return value.id === entity && value.modelMatrix instanceof Matrix4
}

export function findRoamModel(viewer: Viewer, entity: Entity): RoamModelPrimitive | undefined {
  const primitives = viewer.scene.primitives
  for (let index = 0; index < primitives.length; index += 1) {
    const candidate: unknown = primitives.get(index)
    if (isRoamModelPrimitive(candidate, entity)) return candidate
  }
  return undefined
}

/** 步行第一人称隐藏自身模型，避免视口穿模。 */
export function roamModelVisible(vehicleType: GisRoamVehicle, viewMode: GisRoamViewMode): boolean {
  return !(vehicleType === 'walk' && viewMode === 'first_person')
}

export function createRoamEntity(input: {
  viewer: Viewer
  vehicleType: GisRoamVehicle
  viewMode: GisRoamViewMode
  position: Cartesian3
  orientation: Quaternion
  nodeTransformations?: PropertyBag
}): Entity {
  const { viewer, vehicleType, viewMode, position, orientation, nodeTransformations } = input
  const config = GIS_ROAM_CONFIG[vehicleType]

  return viewer.entities.add({
    id: `gis_roam_${vehicleType}`,
    name: config.label,
    position: new CallbackPositionProperty(() => position, false),
    orientation: new CallbackProperty(() => orientation, false),
    model: {
      uri: getModelUri(vehicleType),
      minimumPixelSize: ROAM_MODEL_MIN_PIXEL_SIZE,
      maximumScale: ROAM_MODEL_MAX_SCALE,
      scale: 'modelScale' in config ? config.modelScale : 1,
      // 车辆轮转由行驶距离写入枢轴，不用时钟动画，否则匀速时转速不跟随时速。
      // 客机的起落架和风扇在同一段一次性动画里，跟着时钟播会在滑跑时收起起落架。
      runAnimations: vehicleType === 'walk',
      clampAnimations: false,
      ...(nodeTransformations ? { nodeTransformations } : {}),
      // 运动模型禁止贴地。Cesium 贴地会把经纬度量化到地形瓦片网格后再覆盖平移。
      heightReference: HeightReference.NONE,
      show: new ConstantProperty(roamModelVisible(vehicleType, viewMode))
    }
  })
}

/**
 * 实体矩阵要等下一帧的 dataSourceDisplay 才会写到 Model。
 * 相机在本帧 preUpdate 里已经对准新位置，模型若仍停在上一帧，就会相对镜头窜动。
 */
export function writeRoamModelMatrix(input: {
  viewer: Viewer
  entity: Entity
  position: Cartesian3
  orientation: Quaternion
  headingCorrectionDeg: number
  primitive: RoamModelPrimitive | undefined
}): RoamModelPrimitive | undefined {
  const { viewer, entity, position, orientation, headingCorrectionDeg, primitive } = input
  let model = primitive
  if (!model || model.isDestroyed?.() || model.id !== entity) {
    model = findRoamModel(viewer, entity)
  }
  if (!model) return model

  Quaternion.clone(orientation, scratchOrientation)
  if (Math.abs(headingCorrectionDeg) > 0.01) {
    Quaternion.fromAxisAngle(
      modelAxisUp,
      CesiumMath.toRadians(-headingCorrectionDeg),
      scratchRotation
    )
    Quaternion.multiply(scratchOrientation, scratchRotation, scratchOrientation)
  }
  Matrix4.fromRotationTranslation(
    Matrix3.fromQuaternion(scratchOrientation, scratchMatrix3),
    position,
    model.modelMatrix
  )
  return model
}
