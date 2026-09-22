export interface GazePreset {
  id: string
  label: string
  shortLabel: string
  vector: [number, number]
  tooltip: string
}

export const GAZE_PRESETS: readonly GazePreset[] = [
  {
    id: 'center',
    label: '正视',
    shortLabel: '||',
    vector: [0, 0],
    tooltip: '居中自然正视'
  },
  {
    id: 'left',
    label: '向左看',
    shortLabel: '←',
    vector: [-1, 0],
    tooltip: '向左看：左眼缩小、右眼放大'
  },
  {
    id: 'right',
    label: '向右看',
    shortLabel: '→',
    vector: [1, 0],
    tooltip: '向右看：左眼放大、右眼缩小'
  },
  {
    id: 'top-left',
    label: '左上',
    shortLabel: '↖',
    vector: [-0.85, -0.85],
    tooltip: '左上仰视'
  },
  {
    id: 'top-right',
    label: '右上',
    shortLabel: '↗',
    vector: [0.85, -0.85],
    tooltip: '右上仰视'
  },
  {
    id: 'up',
    label: '仰视',
    shortLabel: '↑',
    vector: [0, -1],
    tooltip: '抬头仰视微放大'
  },
  {
    id: 'down',
    label: '俯视',
    shortLabel: '↓',
    vector: [0, 1],
    tooltip: '低头注视'
  },
  {
    id: 'bottom-left',
    label: '左下',
    shortLabel: '↙',
    vector: [-0.85, 0.85],
    tooltip: '左下斜视'
  },
  {
    id: 'bottom-right',
    label: '右下',
    shortLabel: '↘',
    vector: [0.85, 0.85],
    tooltip: '右下斜视'
  }
] as const
