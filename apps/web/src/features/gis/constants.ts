import { GIS_SCENE_MODEL_CATEGORY_LABELS, GIS_SCENE_MODELS } from './scene-models'

import type { GisSceneModelCategoryId } from './scene-models'

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

export type GisSceneModelId = (typeof GIS_SCENE_MODELS)[number]['id']

const GIS_SCENE_MODEL_IDS = GIS_SCENE_MODELS.map((model) => model.id) as [
  GisSceneModelId,
  ...GisSceneModelId[]
]

/** 供工具参数枚举。顺序与场景模型目录一致。 */
export const GIS_SCENE_MODEL_ID_ENUM = GIS_SCENE_MODEL_IDS

/** 漫游按载具 id 取地址，地址只来自场景模型目录。 */
export const GIS_MODEL_PATHS = {
  pedestrian: sceneModelUri('sophia'),
  vehicle: sceneModelUri('vehicle'),
  airplane: sceneModelUri('dc10'),
  fighter: sceneModelUri('fighter'),
  airdrop: sceneModelUri('airdrop'),
  tree: sceneModelUri('tree'),
  building: sceneModelUri('building'),
  streetlight: sceneModelUri('streetlight'),
  trafficLight: sceneModelUri('trafficLight')
} as const

export type { GisSceneModelCategoryId }

const GIS_SCENE_MODEL_VARIANT_CATEGORY_IDS = (
  Object.keys(GIS_SCENE_MODEL_CATEGORY_LABELS) as GisSceneModelCategoryId[]
).filter(
  (categoryId) => GIS_SCENE_MODELS.filter((model) => model.category === categoryId).length > 1
) as [GisSceneModelCategoryId, ...GisSceneModelCategoryId[]]

/** 含多个模型的类别。只说类别名时传这些值，由工具随机选具体模型。 */
export const GIS_SCENE_MODEL_VARIANT_CATEGORY_ENUM = GIS_SCENE_MODEL_VARIANT_CATEGORY_IDS

/** 把目录写成助手可读的模型列表。 */
export function formatSceneModelGuide(): string {
  return GIS_SCENE_MODELS.map((model) => `${model.id}（${model.label}）`).join('、')
}

/** 多款式类别的选型说明。具体款式传 modelId，只说类别则传 category。 */
export function formatSceneModelVariantGuide(): string {
  const groups = GIS_SCENE_MODEL_VARIANT_CATEGORY_ENUM.map((categoryId) => {
    const options = GIS_SCENE_MODELS.filter((model) => model.category === categoryId)
      .map((model) => `${model.id}（${model.label}）`)
      .join('、')
    return `${GIS_SCENE_MODEL_CATEGORY_LABELS[categoryId]}（category=${categoryId}）：${options}`
  }).join('。')

  return `同一类别有多个模型时：用户只说类别、没有点名具体款式，只传 category、不要传 modelId，由工具随机选一个，不要追问，也不要总选同一个。用户点名了某个模型名称里的具体款式时，只传对应 modelId，不要传 category。和类别同名的模型不是默认项。${groups}。其余只有一个模型的类别直接传 modelId。`
}

/** 从多款式类别中均匀随机选一个模型。类别不存在时返回 undefined。 */
export function pickSceneModelInCategory(categoryId: string) {
  const models = GIS_SCENE_MODELS.filter((model) => model.category === categoryId)
  if (models.length === 0) return undefined
  const index = Math.floor(Math.random() * models.length)
  return models[index]
}

/** 按 id 查找目录项。id 不在目录中时返回 undefined。 */
export function findSceneModel(id: string) {
  return GIS_SCENE_MODELS.find((model) => model.id === id)
}

function sceneModelUri(id: GisSceneModelId): string {
  const model = GIS_SCENE_MODELS.find((item) => item.id === id)
  if (!model) {
    throw new Error(`未知场景模型：${id}`)
  }
  return model.uri
}

/**
 * 部署瓦片的加载策略。几何误差由模型实测直径和这里的目标像素共同决定，
 * 不按模型手写 LOD。
 */
export const GIS_DEPLOY_LOD = {
  /** 模型在屏幕上达到该像素尺寸时加载 GLB */
  targetPixels: 64,
  maximumScreenSpaceError: 16,
  /** geohash 精度 7，格子边长约 150 米 */
  geohashPrecision: 7,
  /** 格子根节点使用足够大的几何误差，由每个模型自己的几何误差决定是否加载 */
  cellGeometricError: 1_000_000
} as const

/** 漫游载具距离阈值（米） */
export const GIS_ROAM_THRESHOLDS = {
  /** 步行距离上限：<= 2km (2000米) 使用人物步行 */
  WALK_MAX_METERS: 2000,
  /** 车辆距离上限：> 2km 且 <= 100km (100000米) 使用车辆 */
  VEHICLE_MAX_METERS: 100000
} as const

/**
 * 载具用途。用户没点名模型时，按用途选载具，而不是按距离。
 * 点了名（如「歼-20」「客机」「汽车」）以点名为准。两者都没有时才按距离自动选。
 */
export const GIS_ROAM_VEHICLE_PURPOSES = {
  walk: {
    model: '人物',
    purpose: '步行',
    cues: ['步行', '走路', '散步', '徒步']
  },
  vehicle: {
    model: '汽车',
    purpose: '自驾',
    cues: ['自驾', '驾驶', '开车', '驾车', '乘车']
  },
  plane: {
    model: '客机',
    purpose: '民航飞行',
    cues: ['坐飞机', '航班', '客机', '民航', '万米高空']
  },
  fighter: {
    model: '歼-20',
    purpose: '空中巡检',
    cues: ['空中巡检', '空中巡逻', '战机巡航', '战斗机巡航', '歼击机巡航']
  }
} as const

/** 漫游最少航路点要求 */
export const GIS_ROAM_MIN_WAYPOINTS = 2

/** 把载具用途写成选型说明，供助手指令和工具参数共用。 */
export function formatRoamVehiclePurposeGuide(): string {
  return Object.entries(GIS_ROAM_VEHICLE_PURPOSES)
    .map(
      ([vehicle, item]) => `${item.cues.join('、')} → ${vehicle}（${item.model}，${item.purpose}）`
    )
    .join('；')
}

/** 漫游视角类型：第一人称（主观驾驶/视线，露出车头/机头）、第三人称（跟随视角）与自由视角（默认高空俯视，可自由旋转拖拽） */
export type GisRoamViewMode = 'first_person' | 'third_person' | 'free'

/** 漫游速度与动力学物理参数（km/h、加减速度）与多视角配置 */
export const GIS_ROAM_CONFIG = {
  walk: {
    /** 真实自然步行巡航时速：5.0 km/h (约 1.39 m/s) */
    cruiseSpeedKmh: 5.0,
    speedMps: 5.0 / 3.6,
    /** 固定起步/加速物理加速度 (m/s²) */
    accelerationMps2: 1.5,
    /** 固定刹车/减速物理减速度 (m/s²) */
    decelerationMps2: 2.0,
    /** 手动调节速度单步步长 (km/h) */
    speedStepKmh: 2.0,
    minSpeedKmh: 2.0,
    maxSpeedKmh: 20.0,
    altitudeOffset: 0,
    clampToGround: true,
    /**
     * Sophia 网格按厘米导出，约 1.72m 高。漫游按 0.01 缩成米。
     * 脚底在缩放后的 glTF 上轴 -0.027m，贴地时把原点抬到这个高度。
     */
    modelScale: 0.01,
    originLiftMeters: 0.027,
    label: '步行漫游',
    headingCorrectionDeg: 0,
    freeOverviewDistanceMeters: 40,
    firstPerson: {
      /** 原点在脚底。眼高约 1.55m。第一人称会隐藏模型。 */
      offset: { x: 0.0, y: 0.0, z: 1.55 },
      pitchDeg: -2,
      headingDeg: 0,
      bobbing: null
    },
    thirdPerson: {
      /** 原点在脚底，相机在身后约 5m、离地约 2.6m。 */
      offset: { x: -5.0, y: 0.0, z: 2.6 },
      pitchDeg: -12,
      headingDeg: 0,
      bobbing: null
    }
  },
  vehicle: {
    /** 城市车辆巡航时速：60.0 km/h (约 16.67 m/s) */
    cruiseSpeedKmh: 60.0,
    speedMps: 60.0 / 3.6,
    /** 固定起步/加速物理加速度 (m/s²)：家用车平稳推背感约 3.5 m/s² */
    accelerationMps2: 3.5,
    /** 固定刹车/减速物理减速度 (m/s²)：常规制动约 4.5 m/s² */
    decelerationMps2: 4.5,
    /** 手动调节速度单步步长 (km/h) */
    speedStepKmh: 20.0,
    minSpeedKmh: 10.0,
    maxSpeedKmh: 180.0,
    altitudeOffset: 0,
    clampToGround: true,
    label: '车辆巡航',
    headingCorrectionDeg: 0,
    freeOverviewDistanceMeters: 35,
    /** 轮胎半径（米）。转速 = 行驶距离 / 半径，与车轮网格直径 0.52m 一致。 */
    wheelRadiusMeters: 0.26,
    firstPerson: {
      /**
       * 眼位在方向盘后方、驾驶座高度。
       * 方向盘中心约在模型 (+0.24, +0.32, +0.78)，+X 为车头，+Y 为左侧。
       */
      offset: { x: -0.14, y: 0.32, z: 0.96 },
      pitchDeg: -8,
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
    /** 固定起步/爬升加速度 (m/s²)：民航客机起飞滑跑加速度约 2.5 m/s² */
    accelerationMps2: 2.5,
    /** 固定降速/滑跑减速度 (m/s²) */
    decelerationMps2: 2.0,
    /** 手动调节速度单步步长 (km/h) */
    speedStepKmh: 100.0,
    minSpeedKmh: 200.0,
    maxSpeedKmh: 1200.0,
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
    /**
     * 世界坐标全长 55.6m，与 DC-10-30 实长 55.5m 一致，按原尺寸放置。
     */
    modelScale: 1,
    /**
     * 轮底在 glTF Y=-2.32，Cesium 轴校正后低于原点 2.32m。
     * 原点抬到地形以上 2.5m，轮胎离地约 0.2m。
     */
    gearHeightMeters: 2.5,
    /** 起落架从放下收到收起的时长（秒） */
    gearRetractSeconds: 8,
    /**
     * 轮胎半径（米）。鼻轮直径约 0.98，主轮约 1.32，滚动取中间值。
     */
    wheelRadiusMeters: 0.6,
    /** 巡航时单台风扇角速度（弧度/秒）。滑行按空速比例减速，但不低于三成五。 */
    fanRadiansPerSecond: 28,
    label: '飞行漫游',
    /**
     * 机头在 glTF -X。Cesium 把 glTF +Z 转到飞行前方 +X，机头落在左侧。
     * 绕上轴 -90° 后机头贴上航线，机尾在身后。
     */
    headingCorrectionDeg: -90,
    freeOverviewDistanceMeters: 180,
    firstPerson: {
      /**
       * 眼位在机头风挡。机头尖在飞行前方 27.8m，舱顶约 11.5m。
       * 眼位在机头后约 4m、离原点高 9m、机体中线。
       */
      offset: { x: 24, y: 0, z: 9 },
      pitchDeg: -6,
      headingDeg: 0,
      bobbing: null
    },
    thirdPerson: {
      /** 机尾在飞行后方约 28m，相机再退后，并从上方看整机。 */
      offset: { x: -80, y: 0, z: 22 },
      pitchDeg: -12,
      headingDeg: 0,
      bobbing: null
    }
  },
  fighter: {
    /**
     * 歼-20 空中巡检巡航时速：900 km/h（约马赫 0.74，亚音速目视巡逻）。
     * 加力冲刺上限约 2100 km/h，接近该机超音速巡航包线。
     */
    cruiseSpeedKmh: 900,
    speedMps: 900 / 3.6,
    /** 军用推力加速约 7 m/s²，比客机滑跑更陡 */
    accelerationMps2: 7,
    decelerationMps2: 5,
    speedStepKmh: 100,
    minSpeedKmh: 400,
    maxSpeedKmh: 2100,
    /**
     * 相对航路点高程的巡检高度（米）。
     * 低于客机万米巡航，便于从座舱观察地表。
     */
    altitudeOffset: 1500,
    clampToGround: false,
    /**
     * 模型原点到机腹的距离（米）。glTF 机腹在 Y≈1.84，Cesium 轴校正后为局部 +Z。
     */
    gearHeightMeters: 2.2,
    label: '歼-20 巡航',
    /**
     * glTF 机头在 +X。Cesium 按 glTF 的 +Z 为前再转一次，机头落到机体左侧，会横着切航线。
     * 绕上轴回正 90°，让机头贴上航线切线。
     */
    headingCorrectionDeg: 90,
    freeOverviewDistanceMeters: 55,
    firstPerson: {
      /**
       * 座舱眼位。模型经 Cesium 轴校正后机头朝 +X，鼻锥在 +4.3m，垂尾在 -16m。
       * 模型没有座舱内饰。眼位在座舱盖后沿上方、机体中线（glTF Z=-0.89 → 局部 +Y 0.89），
       * 沿机头俯视，能看到鼻锥和舱盖，又不会钻进外壳被背面剔除。
       */
      offset: { x: -6.5, y: 0.89, z: 5.4 },
      pitchDeg: -18,
      headingDeg: 0,
      bobbing: null
    },
    thirdPerson: {
      /** 追尾视角：机尾在局部 -16m，相机再退后，并对准机体中线。 */
      offset: { x: -32, y: 0.89, z: 8 },
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
      /** 每 30° 偏航的基准时长（秒），实际时长按角度等比放大 */
      durationSec: 4.0
    },
    airdrop: {
      /** 空投物资箱下落重力终端速度 (m/s) */
      terminalVelocityMps: 15,
      /** 伞衣中心相对箱底、沿模型上轴的高度（米），与 airdrop.glb 一致 */
      canopyHeightMeters: 9.6,
      /**
       * 驾驶舱眼位再向左偏出机身（米）。
       * 从侧窗看下落的空投，视线不被机身挡住。
       */
      cockpitSideOffsetMeters: 8
    }
  },
  /** 歼-20 巡检机动：爬升俯冲，以及绕航线前轴滚转到保持坡度 */
  fighter: {
    diveClimb: {
      deltaAltitudeMeters: 400,
      pitchAngleDeg: 28,
      durationSec: 4
    },
    rollAxis: {
      /** 滚到目标坡度的时长（秒） */
      durationSec: 1.6,
      maxBankDeg: 90
    }
  }
} as const

/** 漫游播放倍速可选预设 */
export const GIS_ROAM_SPEED_MULTIPLIERS = [0.5, 1, 2, 4, 8, 16] as const

/** 坐标定位完成后，闪烁标记的停留时长（毫秒） */
export const GIS_LOCATE_FLASH_DURATION_MS = 3000
