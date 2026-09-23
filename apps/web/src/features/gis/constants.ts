export const CESIUM_DEFAULT_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6InI0RTBnenFLV0E4X3RoZmkiLCJqdGkiOiJjM2IwOGI4MC01N2UwLTRlNDQtYTkzNC0zYWNkN2U3MzdiYzUiLCJpZCI6NDM5Njk5LCJzdWIiOiJCYWlsaW55aXlpIiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IkJhaWxpbnlpeWlfZGVmYXVsdCIsImlhdCI6MTc4NzU0MzAxNn0.bIIN3xEiN8LC5TaD_dPPNEe-0FGEdSSP0V3Q5iFZdrQ`

/** 天地图服务 Token（优先读取环境变量 VITE_TIANDITU_TOKEN） */
export const TIANDITU_TOKEN =
  (import.meta.env.VITE_TIANDITU_TOKEN as string | undefined) || '1d109683f4d84198e37a38c442d68311'

/** 天地图切片服务器子域名 */
export const TIANDITU_SUBDOMAINS = ['0', '1', '2', '3', '4', '5', '6', '7'] as const

/** 天地图 WMTS 服务端点定义 */
export const TIANDITU_WMTS_URLS = {
  /** 全球影像底图（Web 墨卡托投影） */
  imagery: 'https://t{s}.tianditu.gov.cn/img_w/wmts',
  /** 全球影像注记（含中文地名路网） */
  annotation: 'https://t{s}.tianditu.gov.cn/cia_w/wmts'
} as const

/** 全球俯瞰初始参考点（中国中心高空太空视角） */
export const GIS_GLOBAL_OVERVIEW_VIEW = {
  longitude: 108.5,
  latitude: 34.0,
  height: 12000000
} as const

/** 场景默认初始相机视角（默认定位：中国南京） */
export const GIS_INITIAL_VIEW = {
  /** 南京中心经度（新街口/玄武湖中心区域） */
  longitude: 118.7969,
  /** 南京中心纬度 */
  latitude: 32.0603,
  /** 默认相机高度（米）：约 20000米（20km）全景鸟瞰 */
  height: 20000,
  /** 航向角（度，正北为 0） */
  headingDeg: 0,
  /** 俯仰角（度，-90 为垂直俯视，-45 为三维立体斜俯视） */
  pitchDeg: -45,
  /** 翻滚角（度） */
  rollDeg: 0,
  /** 入场飞行动画耗时（秒） */
  flyDurationSec: 3.0
} as const

/** 漫游模型与部署模型路径定义 */
export const GIS_MODEL_PATHS = {
  pedestrian: '/models/人.glb',
  vehicle: '/models/car.glb',
  airplane: '/models/airplane.glb',
  tree: '/models/tree.glb',
  building: '/models/building.glb',
  streetlight: '/models/路灯.glb',
  trafficSign: '/models/交通标志.glb'
} as const

/** 漫游载具距离阈值（米） */
export const GIS_ROAM_THRESHOLDS = {
  /** 步行距离上限：<= 2km (2000米) 使用人物步行 */
  WALK_MAX_METERS: 2000,
  /** 车辆距离上限：> 2km 且 <= 100km (100000米) 使用车辆 */
  VEHICLE_MAX_METERS: 100000
} as const

/** 漫游最少航路点要求 */
export const GIS_ROAM_MIN_WAYPOINTS = 2

/** 漫游视角类型：第一人称（主观驾驶/视线，露出车头/机头）、第三人称（跟随视角）与自由视角（默认高空俯视，可自由旋转拖拽） */
export type GisRoamViewMode = 'first_person' | 'third_person' | 'free'

/** 漫游速度参数（米/秒）与多视角配置 */
export const GIS_ROAM_CONFIG = {
  walk: {
    /** 真实自然步行航速：约 1.4 m/s (5.0 km/h) */
    speedMps: 1.4,
    altitudeOffset: 0,
    clampToGround: true,
    label: '步行漫游',
    /** 局部朝向校准（模型物理资产已转正为 glTF 的 +Z 轴，与 Cesium 原生 VelocityOrientation 100% 对齐） */
    headingCorrectionDeg: 0,
    /** 自由视角默认鸟瞰距离（米） */
    freeOverviewDistanceMeters: 40,
    /** 第一人称（行人人眼高度 1.70m 平视前方，模型自动隐藏，视野开阔平稳零遮挡） */
    firstPerson: {
      offset: { x: 0.0, y: 0.0, z: 1.7 },
      pitchDeg: -2,
      headingDeg: 0,
      bobbing: null
    },
    /** 第三人称（经典游戏级背后追随视角，清晰观察人物全身行走动作） */
    thirdPerson: {
      offset: { x: -5.0, y: 0.0, z: 2.8 },
      pitchDeg: -12,
      headingDeg: 0,
      bobbing: null
    }
  },
  vehicle: {
    /** 城市车辆平稳巡航航速：15 m/s (54 km/h) */
    speedMps: 15,
    altitudeOffset: 0,
    clampToGround: true,
    label: '车辆巡航',
    /** 局部朝向校准（car.glb 资产原生车头对齐 glTF 的 +Z 轴，与 Cesium VelocityOrientation 完美对齐） */
    headingCorrectionDeg: 0,
    /** 自由视角默认鸟瞰距离（米） */
    freeOverviewDistanceMeters: 35,
    /** 第一人称（真实左驾座舱驾驶视线：位于方向盘后方，透过前风挡平视俯瞰机盖与前方路面） */
    firstPerson: {
      offset: { x: 0.3, y: 0.45, z: 1.15 },
      pitchDeg: -3,
      headingDeg: 0,
      bobbing: null
    },
    /** 第三人称（经典 GTA/赛车游戏近距追尾跟车视角，近距清晰饱览整车流线轮廓与四轮姿态） */
    thirdPerson: {
      offset: { x: -6.5, y: 0.0, z: 2.1 },
      pitchDeg: -7,
      headingDeg: 0,
      bobbing: null
    }
  },
  plane: {
    /** 巡航飞行速度：160 m/s (576 km/h) */
    speedMps: 160,
    altitudeOffset: 600,
    clampToGround: false,
    label: '飞行漫游',
    /** 局部朝向校准（airplane.glb 资产原生对齐 glTF 的 +Z 轴） */
    headingCorrectionDeg: 0,
    /** 自由视角默认鸟瞰距离（米） */
    freeOverviewDistanceMeters: 600,
    /** 第一人称（飞行员真实座舱视线：位于风挡玻璃正后方，视线平稳无抖动，下方平视微露机鼻） */
    firstPerson: {
      offset: { x: 11.5, y: 0.0, z: 4.2 },
      pitchDeg: -4,
      headingDeg: 0,
      bobbing: null
    },
    /** 第三人称（空中航拍追尾跟飞视角：拉远拉高，整架大型干线客机与双发翼展全貌一览无遗） */
    thirdPerson: {
      offset: { x: -75.0, y: 0.0, z: 24.0 },
      pitchDeg: -12,
      headingDeg: 0,
      bobbing: null
    }
  }
} as const
