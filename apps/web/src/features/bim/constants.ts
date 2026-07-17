/** Outline 后处理单次选中上限，超出部分忽略 */
export const MAX_BIM_SELECTION = 200

/** 室内漫游视高（米），点位为地面点击时相机抬升至此高度 */
export const WALKTHROUGH_EYE_HEIGHT = 1.6

/** 漫游行走速度（米/秒） */
export const WALKTHROUGH_SPEED = 1.2

/** 路径前瞻距离占比，用于人物朝向 */
export const WALKTHROUGH_LOOK_AHEAD = 0.04

/** 第三人称跟随：相机距人物水平距离（米），室内宜贴近 */
export const WALKTHROUGH_CAMERA_DISTANCE = 1.8

/** 第三人称跟随：相机相对脚底高度（米） */
export const WALKTHROUGH_CAMERA_HEIGHT = 1.75

/** 第三人称跟随：注视点相对脚底高度（米） */
export const WALKTHROUGH_CAMERA_LOOK_HEIGHT = 1.35

/** 相机被墙挡住时，与墙面的最小间距（米） */
export const WALKTHROUGH_CAMERA_OCCLUSION_PADDING = 0.2

/** 遮挡拉近后相机与人物的最小距离（米） */
export const WALKTHROUGH_CAMERA_MIN_DISTANCE = 0.55

/** 步行摆动频率（弧度/秒，随速度缩放） */
export const WALKTHROUGH_WALK_CYCLE_SPEED = 9

/** 拾取点击与拖拽的像素阈值，超过视为旋转场景而非拾取 */
export const WALKTHROUGH_PICK_DRAG_THRESHOLD_PX = 5

/** 是否启用人物移动碰撞（穿墙）；相机遮挡拉近不受此开关影响 */
export const WALKTHROUGH_COLLISION_ENABLED = false

/** 漫游碰撞体半径（米），防止穿墙 */
export const WALKTHROUGH_COLLISION_RADIUS = 0.35

/** 碰撞后与墙面的安全间距（米） */
export const WALKTHROUGH_COLLISION_PADDING = 0.08

/** 地面拾取：法线向上分量阈值，越大越偏向水平面 */
export const WALKTHROUGH_FLOOR_NORMAL_Y = 0.45

/** 人物碰撞探针相对脚底的高度（米） */
export const WALKTHROUGH_BODY_PROBE_HEIGHTS = [0.45, 0.95, 1.45] as const

export const IFC_TYPE_MAP = {
  IfcProject: { value: 'IfcProject', label: '项目' },
  IfcBeam: { value: 'IfcBeam', label: '梁' },
  IfcBeamStandardCase: { value: 'IfcBeamStandardCase', label: '标准光束' },
  IfcBuilding: { value: 'IfcBuilding', label: '建筑' },
  IfcBuildingElement: { value: 'IfcBuildingElement', label: '建筑构件' },
  IfcBuildingElementPart: { value: 'IfcBuildingElementPart', label: '建筑构件部分' },
  IfcBuildingElementProxy: { value: 'IfcBuildingElementProxy', label: '建筑构件代替物' },
  IfcBuildingStorey: { value: 'IfcBuildingStorey', label: '建筑楼层' },
  IfcColumn: { value: 'IfcColumn', label: '柱' },
  IfcColumnStandardCase: { value: 'IfcColumnStandardCase', label: '标准栏目' },
  IfcCovering: { value: 'IfcCovering', label: '面层' },
  IfcCurtainWall: { value: 'IfcCurtainWall', label: '幕墙' },
  IfcDoor: { value: 'IfcDoor', label: '门' },
  IfcDoorStandardCase: { value: 'IfcDoorStandardCase', label: '标准门' },
  IfcElement: { value: 'IfcElement', label: '构件' },
  IfcElementAssembly: { value: 'IfcElementAssembly', label: '构件组装' },
  IfcElementComponent: { value: 'IfcElementComponent', label: '构件组件' },
  IfcFooting: { value: 'IfcFooting', label: '基础' },
  IfcFurnishingElement: { value: 'IfcFurnishingElement', label: '装饰构件' },
  IfcGrid: { value: 'IfcGrid', label: '网格' },
  IfcMaterial: { value: 'IfcMaterial', label: '材料' },
  IfcMaterialLayer: { value: 'IfcMaterialLayer', label: '材料层' },
  IfcMechanicalFastener: { value: 'IfcMechanicalFastener', label: '机械紧固件' },
  IfcMember: { value: 'IfcMember', label: '成员' },
  IfcMemberStandardCase: { value: 'IfcMemberStandardCase', label: '标准元素' },
  IfcOpeningElement: { value: 'IfcOpeningElement', label: '孔口' },
  IfcOpeningStandardCase: { value: 'IfcOpeningStandardCase', label: '孔口2' },
  IfcPile: { value: 'IfcPile', label: '桩' },
  IfcPlate: { value: 'IfcPlate', label: '板' },
  IfcPlateStandardCase: { value: 'IfcPlateStandardCase', label: '薄标准板' },
  IfcPresentationLayerAssignment: { value: 'IfcPresentationLayerAssignment', label: '层' },
  IfcRailing: { value: 'IfcRailing', label: '栏杆' },
  IfcRamp: { value: 'IfcRamp', label: '坡道' },
  IfcRampFlight: { value: 'IfcRampFlight', label: '坡道楼梯' },
  IfcReinforcingBar: { value: 'IfcReinforcingBar', label: '加强筋' },
  IfcReinforcingElement: { value: 'IfcReinforcingElement', label: '加强构件' },
  IfcReinforcingMesh: { value: 'IfcReinforcingMesh', label: '加强网' },
  IfcSite: { value: 'IfcSite', label: '场所' },
  IfcRoof: { value: 'IfcRoof', label: '屋顶' },
  IfcSlab: { value: 'IfcSlab', label: '平板' },
  IfcSlabStandardCase: { value: 'IfcSlabStandardCase', label: '标准板' },
  IfcSpace: { value: 'IfcSpace', label: '空间' },
  IfcStair: { value: 'IfcStair', label: '楼梯' },
  IfcStairFlight: { value: 'IfcStairFlight', label: '单段梯' },
  IfcWall: { value: 'IfcWall', label: '墙' },
  IfcWallStandardCase: { value: 'IfcWallStandardCase', label: '标准墙' },
  IfcWindow: { value: 'IfcWindow', label: '窗' },
  IfcWindowStandardCase: { value: 'IfcWindowStandardCase', label: '标准窗口' },
  IfcZone: { value: 'IfcZone', label: '区域' }
} as const

export type IfcType = keyof typeof IFC_TYPE_MAP
