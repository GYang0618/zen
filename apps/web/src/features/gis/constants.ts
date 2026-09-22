export const CESIUM_DEFAULT_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6InI0RTBnenFLV0E4X3RoZmkiLCJqdGkiOiJjM2IwOGI4MC01N2UwLTRlNDQtYTkzNC0zYWNkN2U3MzdiYzUiLCJpZCI6NDM5Njk5LCJzdWIiOiJCYWlsaW55aXlpIiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IkJhaWxpbnlpeWlfZGVmYXVsdCIsImlhdCI6MTc4NzU0MzAxNn0.bIIN3xEiN8LC5TaD_dPPNEe-0FGEdSSP0V3Q5iFZdrQ`

/** 漫游模型与部署模型路径定义 */
export const GIS_MODEL_PATHS = {
  pedestrian: '/models/人.glb',
  vehicle: '/models/车.glb',
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

/** 漫游速度参数（米/秒）与视角配置 */
export const GIS_ROAM_CONFIG = {
  walk: {
    speedMps: 3.5,
    altitudeOffset: 0,
    clampToGround: true,
    cameraRange: 15,
    cameraPitchDeg: -18,
    label: '步行漫游'
  },
  vehicle: {
    speedMps: 25,
    altitudeOffset: 0,
    clampToGround: true,
    cameraRange: 35,
    cameraPitchDeg: -22,
    label: '车辆巡航'
  },
  plane: {
    speedMps: 180,
    altitudeOffset: 800,
    clampToGround: false,
    cameraRange: 120,
    cameraPitchDeg: -28,
    label: '飞行漫游'
  }
} as const
