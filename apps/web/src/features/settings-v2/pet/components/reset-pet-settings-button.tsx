import { Button } from '@zen/ui'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import {
  DEFAULT_AGENT_PET_EYE_SHAPE,
  DEFAULT_AGENT_PET_SHAPE,
  DEFAULT_SCENARIO_EMOTIONS,
  useAgentPetStore
} from '@/features/agent'
import { DEFAULT_EYE_PARAMS, PET_EYE_SHAPES } from '@/features/pets'

export function ResetPetSettingsButton() {
  const shape = useAgentPetStore((s) => s.shape)
  const eyeShape = useAgentPetStore((s) => s.eyeShape)
  const eyeShapeMode = useAgentPetStore((s) => s.eyeShapeMode)
  const eyeParams = useAgentPetStore((s) => s.eyeParams)
  const emotionMode = useAgentPetStore((s) => s.emotionMode)
  const scenarioEmotions = useAgentPetStore((s) => s.scenarioEmotions)
  const resetToDefaults = useAgentPetStore((s) => s.resetToDefaults)

  const isEyeParamsDefault = PET_EYE_SHAPES.every((sh) => {
    const cur = eyeParams[sh]
    const def = DEFAULT_EYE_PARAMS[sh]
    return Object.keys(def).every((k) => cur[k as keyof typeof cur] === def[k as keyof typeof def])
  })

  const isDefault =
    shape === DEFAULT_AGENT_PET_SHAPE &&
    eyeShape === DEFAULT_AGENT_PET_EYE_SHAPE &&
    eyeShapeMode === 'fixed' &&
    emotionMode === 'random' &&
    isEyeParamsDefault &&
    scenarioEmotions.idle === DEFAULT_SCENARIO_EMOTIONS.idle &&
    scenarioEmotions.hover === DEFAULT_SCENARIO_EMOTIONS.hover &&
    scenarioEmotions.open === DEFAULT_SCENARIO_EMOTIONS.open &&
    scenarioEmotions.drag === DEFAULT_SCENARIO_EMOTIONS.drag &&
    scenarioEmotions.running === DEFAULT_SCENARIO_EMOTIONS.running &&
    scenarioEmotions.tucked === DEFAULT_SCENARIO_EMOTIONS.tucked

  const handleReset = () => {
    if (isDefault) return
    resetToDefaults()
    toast.success('已恢复宠物默认设置')
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isDefault}
      onClick={handleReset}
      aria-label="将宠物设置恢复为默认"
      title={isDefault ? '当前已是默认设置' : '将宠物形态、眼睛与表情配置重置为默认'}
    >
      <RotateCcw data-icon="inline-start" className="mr-1.5 size-4" />
      恢复默认
    </Button>
  )
}
