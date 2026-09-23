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

/** 漫游速度与动力学物理参数（km/h、加减速度）与多视角配置 */
export const GIS_ROAM_CONFIG = {
  walk: {
    /** 真实自然步行巡航时速：5.0 km/h (约 1.39 m/s) */
    cruiseSpeedKmh: 5.0,
    speedMps: 5.0 / 3.6,
    /** 固定起步/加速物理加速度 (m/s²) */
    accelerationMps2: 1.2,
    /** 固定刹车/减速物理减速度 (m/s²) */
    decelerationMps2: 1.5,
    /** 手动调节速度单步步长 (km/h) */
    speedStepKmh: 1.0,
    minSpeedKmh: 2.0,
    maxSpeedKmh: 15.0,
    altitudeOffset: 0,
    clampToGround: true,
    label: '步行漫游',
    headingCorrectionDeg: 0,
    freeOverviewDistanceMeters: 40,
    firstPerson: {
      offset: { x: 0.0, y: 0.0, z: 1.7 },
      pitchDeg: -2,
      headingDeg: 0,
      bobbing: null
    },
    thirdPerson: {
      offset: { x: -5.0, y: 0.0, z: 2.8 },
      pitchDeg: -12,
      headingDeg: 0,
      bobbing: null
    }
  },
  vehicle: {
    /** 城市车辆巡航时速：60.0 km/h (约 16.67 m/s) */
    cruiseSpeedKmh: 60.0,
    speedMps: 60.0 / 3.6,
    /** 固定起步/加速物理加速度 (m/s²)：家用车平稳推背感约 2.5 m/s² */
    accelerationMps2: 2.5,
    /** 固定刹车/减速物理减速度 (m/s²)：常规制动约 3.5 m/s² */
    decelerationMps2: 3.5,
    /** 手动调节速度单步步长 (km/h) */
    speedStepKmh: 10.0,
    minSpeedKmh: 10.0,
    maxSpeedKmh: 160.0,
    altitudeOffset: 0,
    clampToGround: true,
    label: '车辆巡航',
    headingCorrectionDeg: 0,
    freeOverviewDistanceMeters: 35,
    firstPerson: {
      offset: { x: 0.3, y: 0.45, z: 1.15 },
      pitchDeg: -3,
      headingDeg: 0,
      bobbing: null
    },
    thirdPerson: {
      offset: { x: -6.5, y: 0.0, z: 2.1 },
      pitchDeg: -7,
      headingDeg: 0,
      bobbing: null
    }
  },
  plane: {
    /** 民航客机真实巡航飞行时速：800.0 km/h (约 222.2 m/s) */
    cruiseSpeedKmh: 800.0,
    speedMps: 800.0 / 3.6,
    /** 固定起步/爬升加速度 (m/s²)：民航客机起飞滑跑加速度约 1.5 m/s² */
    accelerationMps2: 1.5,
    /** 固定降速/滑跑减速度 (m/s²) */
    decelerationMps2: 1.2,
    /** 手动调节速度单步步长 (km/h) */
    speedStepKmh: 50.0,
    minSpeedKmh: 200.0,
    maxSpeedKmh: 950.0,
    /** 真实民航客机标准巡航高程（米）：通常 8,000m ~ 10,000m (FL300) */
    altitudeOffset: 9000,
    /** 起飞离地抬头速度 Vr (km/h) */
    takeoffSpeedKmh: 280,
    /** 进近下滑接地速度 (km/h) */
    landingSpeedKmh: 250,
    /** 地面滑行时速 (km/h) */
    taxiSpeedKmh: 30,
    /** 起飞爬升仰角 (度) */
    climbPitchDeg: 12,
    /** 进近下滑俯角 (度) */
    descentPitchDeg: -4,
    clampToGround: false,
    label: '飞行漫游',
    headingCorrectionDeg: 0,
    freeOverviewDistanceMeters: 600,
    firstPerson: {
      offset: { x: 11.5, y: 0.0, z: 4.2 },
      pitchDeg: -4,
      headingDeg: 0,
      bobbing: null
    },
    thirdPerson: {
      offset: { x: -75.0, y: 0.0, z: 24.0 },
      pitchDeg: -12,
      headingDeg: 0,
      bobbing: null
    }
  }
} as const

/** 漫游实时指令与动作参数 */
export const GIS_ACTION_CONFIG = {
  /** 行人动作 */
  walk: {
    jump: {
      durationSec: 0.8,
      maxHeightMeters: 0.8
    },
    pause: {
      durationSec: 3.0
    }
  },
  /** 车辆动作 */
  vehicle: {
    laneChange: {
      /** 单车道横移距离（米） */
      lateralOffsetMeters: 3.5,
      /** 变道变出耗时 (秒) */
      shiftDurationSec: 1.5,
      /** 超车巡航耗时 (秒) */
      holdDurationSec: 2.0,
      /** 变道超车临时提速 (km/h) */
      overtakeSpeedBoostKmh: 15.0
    }
  },
  /** 飞机动作 */
  plane: {
    diveClimb: {
      deltaAltitudeMeters: 500,
      pitchAngleDeg: 15,
      durationSec: 5.0
    },
    rollTurn: {
      deltaHeadingDeg: 30,
      bankRollDeg: 25,
      durationSec: 4.0
    },
    airdrop: {
      /** 空投物资箱下落重力终端速度 (m/s) */
      terminalVelocityMps: 15,
      boxScale: 2.5
    }
  }
} as const
