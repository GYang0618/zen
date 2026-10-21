/** 类别名称。用户只说这个名字、没点具体款式时，从该类别随机选模型。 */
export const GIS_SCENE_MODEL_CATEGORY_LABELS = {
  person: '人物',
  vehicle: '汽车',
  aircraft: '飞机',
  airdrop: '空投',
  vegetation: '树木灌木',
  building: '建筑',
  streetlight: '路灯',
  utility: '电线杆',
  surveillance: '监控摄像头',
  traffic: '信号灯'
} as const

export type GisSceneModelCategoryId = keyof typeof GIS_SCENE_MODEL_CATEGORY_LABELS

/**
 * 场景模型目录。登记 id、名称、类别、GLB 地址和预览图地址。
 * 预览图在 public/models/previews，文件名与模型文件同名。
 * 同一 category 有多个模型时，用户只说类别则随机选一个，点名具体名称才用对应模型。
 * heightMeters 是 glTF 向上轴（Y）的真实高度。Sketchfab 导出的单位常常不是米，部署时用它把模型缩放到真实尺寸；文件本身已是米的模型不写这个字段。
 */
export const GIS_SCENE_MODELS = [
  {
    id: 'pedestrian',
    label: '人物',
    category: 'person',
    uri: '/models/cesium_man.glb',
    preview: '/models/previews/cesium_man.png'
  },
  /** Casual Grey Shirt And Dark Denim，restore50，CC BY 4.0，https://sketchfab.com/3d-models/casual-grey-shirt-and-dark-denim-fd865b137fc240f295d44869a3b17138 */
  {
    id: 'casualGrey',
    label: '灰衬衫人物',
    category: 'person',
    uri: '/models/casual_grey_shirt_and_dark_denim.glb',
    preview: '/models/previews/casual_grey_shirt_and_dark_denim.png'
  },
  /** Casual Confidence In A Black Tee，restore50，CC BY 4.0，https://sketchfab.com/3d-models/casual-confidence-in-a-black-tee-2f8792feb3fc499991f202f0f506e61c */
  {
    id: 'blackTee',
    label: '黑T恤人物',
    category: 'person',
    uri: '/models/jom.glb',
    preview: '/models/previews/jom.png'
  },
  /** Navy Blazer Ensemble，restore50，CC BY 4.0，https://sketchfab.com/3d-models/navy-blazer-ensemble-01bc3b6ca8ee4bde998b5181279b304c */
  {
    id: 'navyBlazer',
    label: '西装人物',
    category: 'person',
    uri: '/models/navy_blazer_ensemble.glb',
    preview: '/models/previews/navy_blazer_ensemble.png'
  },
  /** Sophia Animated 003，Renderpeople，CC BY 4.0，https://sketchfab.com/3d-models/sophia-animated-003-animated-3d-woman-dc448c3be0e74f96a55fb475a13433cf */
  {
    id: 'sophia',
    label: 'Sophia（索菲亚）',
    category: 'person',
    uri: '/models/sophia.glb',
    preview: '/models/previews/sophia.jpg',
    heightMeters: 1.7
  },
  /** Mr Man Walking，Instinto Ideal Studio，CC BY 4.0，https://sketchfab.com/3d-models/mr-man-walking-98ccac2b0e2845789b6f789978ca06ed */
  {
    id: 'mrMan',
    label: '步行男士',
    category: 'person',
    uri: '/models/mr_man_walking.glb',
    preview: '/models/previews/mr_man_walking.jpg',
    heightMeters: 1.8
  },
  {
    id: 'vehicle',
    label: '汽车',
    category: 'vehicle',
    uri: '/models/car.glb',
    preview: '/models/previews/car.png'
  },
  {
    id: 'airplane',
    label: '螺旋桨飞机',
    category: 'aircraft',
    uri: '/models/airplane.glb',
    preview: '/models/previews/airplane.png',
    heightMeters: 3.2
  },
  /** DC-10-30 FedEx，mudkipz321，CC BY 4.0，https://sketchfab.com/3d-models/dc-10-30-fedex-b71df28e7cf1464dadd04b6f0e076c77 */
  {
    id: 'dc10',
    label: '货机DC-10',
    category: 'aircraft',
    uri: '/models/dc-10-30_fedex.glb',
    preview: '/models/previews/dc-10-30_fedex.jpg'
  },
  /** 歼-20。Chengdu J-20 Fighter，andertan，CC BY 4.0，https://sketchfab.com/3d-models/chengdu-j-20-fighter-817bcfb55c3e4fcb864e4296e2e57a95 */
  {
    id: 'fighter',
    label: '歼-20',
    category: 'aircraft',
    uri: '/models/j-20.glb',
    preview: '/models/previews/j-20.png'
  },
  /**
   * 空投。伞衣：Poly by Google，CC BY 3.0，https://poly.pizza/m/8otDbaIqkhU
   * 木箱：Quaternius，CC0 1.0，https://poly.pizza/m/YAghI6GBls
   * 已去掉伞下的跳伞员，木箱接在吊绳下。伞径约 11 米，原点在箱底。
   */
  {
    id: 'airdrop',
    label: '空投',
    category: 'airdrop',
    uri: '/models/airdrop.glb',
    preview: '/models/previews/airdrop.png'
  },
  /** Trees and bush Pack LOWPOLY，EFX，CC BY 4.0，https://sketchfab.com/3d-models/trees-and-bush-pack-lowpoly-f2a25ee70df440c9ab03d57aba2dc3f2 */
  {
    id: 'tree',
    label: '树木灌木',
    category: 'vegetation',
    uri: '/models/trees_and_bush_pack_lowpoly.glb',
    preview: '/models/previews/trees_and_bush_pack_lowpoly.png',
    heightMeters: 16
  },
  {
    id: 'building',
    label: '建筑',
    category: 'building',
    uri: '/models/building.glb',
    preview: '/models/previews/building.png',
    heightMeters: 30
  },
  /** StreetLight，ZakAttttack，CC BY 4.0 */
  {
    id: 'streetlight',
    label: '路灯',
    category: 'streetlight',
    uri: '/models/streetlight.glb',
    preview: '/models/previews/streetlight.png',
    heightMeters: 9
  },
  /** Rooftop Utility Pole，TomasKiniulis，CC BY 4.0 */
  {
    id: 'utilityPole',
    label: '电线杆',
    category: 'utility',
    uri: '/models/rooftop_utility_pole.glb',
    preview: '/models/previews/rooftop_utility_pole.png',
    heightMeters: 12
  },
  /** Surveillance Cam，Marcel Schanz，CC BY 4.0。壁挂枪机含支架，竖直方向约 0.25 米。 */
  {
    id: 'surveillanceCam',
    label: '监控摄像头',
    category: 'surveillance',
    uri: '/models/surveillance_cam.glb',
    preview: '/models/previews/surveillance_cam.png',
    heightMeters: 0.25
  },
  /** Traffic Light，miwaVV，CC BY 4.0 */
  {
    id: 'trafficLight',
    label: '信号灯（红绿灯）',
    category: 'traffic',
    uri: '/models/traffic_light.glb',
    preview: '/models/previews/traffic_light.png',
    heightMeters: 7
  }
] as const
