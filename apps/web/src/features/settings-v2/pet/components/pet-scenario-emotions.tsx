import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { DEFAULT_SCENARIO_EMOTIONS, useAgentPetStore } from '@/features/agent'
import { EMOTIONS_CATALOG } from '@/features/pets'

import type { ScenarioEmotions } from '@/features/agent'
import type { PetEmotion } from '@/features/pets'

interface ScenarioMeta {
  key: keyof ScenarioEmotions
  name: string
  description: string
  defaultEmotion: PetEmotion
}

const SCENARIO_LIST: readonly ScenarioMeta[] = [
  {
    key: 'idle',
    name: '待机常态',
    description: '无操作时的基础表情（固定表情模式或基础基准）',
    defaultEmotion: DEFAULT_SCENARIO_EMOTIONS.idle
  },
  {
    key: 'hover',
    name: '鼠标悬停',
    description: '鼠标光标移至悬浮球上方时的打招呼互动表情',
    defaultEmotion: DEFAULT_SCENARIO_EMOTIONS.hover
  },
  {
    key: 'open',
    name: '窗口打开',
    description: '点击悬浮球展开 AI 会话窗口时的陪伴表情',
    defaultEmotion: DEFAULT_SCENARIO_EMOTIONS.open
  },
  {
    key: 'drag',
    name: '拖拽移动',
    description: '鼠标长按悬浮球并拖拽移动时的受动表情',
    defaultEmotion: DEFAULT_SCENARIO_EMOTIONS.drag
  },
  {
    key: 'running',
    name: 'AI 思考',
    description: 'Agent 正在思考、执行工具调用或生成回答时的专注表情',
    defaultEmotion: DEFAULT_SCENARIO_EMOTIONS.running
  },
  {
    key: 'tucked',
    name: '贴边休眠',
    description: '悬浮球自动靠边半隐藏吸附时的休眠表情',
    defaultEmotion: DEFAULT_SCENARIO_EMOTIONS.tucked
  }
]

const EMOTION_ITEMS = EMOTIONS_CATALOG.map((emo) => ({
  value: emo.id,
  label: `${emo.emoji} ${emo.label}`
}))

export function PetScenarioEmotions() {
  const scenarioEmotions = useAgentPetStore((s) => s.scenarioEmotions)
  const setScenarioEmotion = useAgentPetStore((s) => s.setScenarioEmotion)
  const resetScenarioEmotions = useAgentPetStore((s) => s.resetScenarioEmotions)
  const setPreviewEmotion = useAgentPetStore((s) => s.setPreviewEmotion)

  const isScenarioDefault = SCENARIO_LIST.every(
    (sc) => scenarioEmotions[sc.key] === sc.defaultEmotion
  )

  const handleResetScenarios = () => {
    if (isScenarioDefault) return
    resetScenarioEmotions()
    toast.success('已恢复各场景默认表情')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          为 6 大关键交互场景分别赋予专属微表情，让助手更富生机与性格：
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isScenarioDefault}
          onClick={handleResetScenarios}
          className="self-start text-xs sm:self-auto"
        >
          <RotateCcw className="mr-1.5 size-3.5" />
          恢复场景默认表情
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIO_LIST.map((sc) => {
          const currentEmotion = scenarioEmotions[sc.key]

          return (
            <div
              key={sc.key}
              className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-all hover:border-border"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">{sc.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    默认: {EMOTIONS_CATALOG.find((e) => e.id === sc.defaultEmotion)?.label}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-xs text-muted-foreground">触发表情:</span>
                <Select
                  items={EMOTION_ITEMS}
                  value={currentEmotion}
                  onValueChange={(val) => {
                    if (val) {
                      setScenarioEmotion(sc.key, val as PetEmotion)
                      setPreviewEmotion(val as PetEmotion)
                      setTimeout(() => {
                        if (useAgentPetStore.getState().previewEmotion === val) {
                          setPreviewEmotion(null)
                        }
                      }, 2000)
                    }
                  }}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EMOTIONS_CATALOG.map((emo) => (
                        <SelectItem key={emo.id} value={emo.id} className="text-xs">
                          <span className="mr-1.5">{emo.emoji}</span>
                          <span>{emo.label}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
