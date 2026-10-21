import { Badge, Button, Card, CardContent, cn } from '@zen/ui'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAgentPetStore } from '@/features/agent'
import { EYE_SHAPES_CATALOG, Pet, PRESET_PETS } from '@/features/pets'

import type { ScenarioEmotions } from '@/features/agent'
import type { PetEmotion } from '@/features/pets'

interface ScenarioOption {
  key: keyof ScenarioEmotions
  label: string
  desc: string
}

const SCENARIO_PREVIEWS: readonly ScenarioOption[] = [
  { key: 'idle', label: '待机常态', desc: '无操作时的基准状态' },
  { key: 'hover', label: '鼠标悬停', desc: '光标移至悬浮球上方' },
  { key: 'open', label: '窗口打开', desc: 'AI 对话面板展开中' },
  { key: 'drag', label: '拖拽移动', desc: '按住拖动悬浮球' },
  { key: 'running', label: 'AI 思考', desc: 'Agent 正在执行指令' },
  { key: 'tucked', label: '贴边休眠', desc: '靠边半隐藏休眠中' }
]

export function PetPreviewStage() {
  const shape = useAgentPetStore((s) => s.shape)
  const eyeShape = useAgentPetStore((s) => s.eyeShape)
  const eyeShapeMode = useAgentPetStore((s) => s.eyeShapeMode)
  const eyeParams = useAgentPetStore((s) => s.eyeParams)
  const emotionMode = useAgentPetStore((s) => s.emotionMode)
  const scenarioEmotions = useAgentPetStore((s) => s.scenarioEmotions)
  const setPreviewEmotion = useAgentPetStore((s) => s.setPreviewEmotion)

  const [activeScenario, setActiveScenario] = useState<keyof ScenarioEmotions | null>(null)
  const [squishSignal, setSquishSignal] = useState(0)

  // 离开宠物设置页时，清空全局预览表情
  useEffect(() => {
    return () => {
      useAgentPetStore.getState().setPreviewEmotion(null)
    }
  }, [])

  const currentPreset = PRESET_PETS.find((p) => p.id === shape) ?? PRESET_PETS[0]!
  const currentEyeMeta = EYE_SHAPES_CATALOG.find((e) => e.id === eyeShape) ?? EYE_SHAPES_CATALOG[0]!

  const previewEmotion: PetEmotion = activeScenario
    ? scenarioEmotions[activeScenario]
    : emotionMode === 'fixed'
      ? scenarioEmotions.idle
      : 'happy'

  const handlePetClick = () => {
    setSquishSignal((c) => c + 1)
  }

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/30">
      <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-stretch sm:justify-between">
        {/* 左侧宠物视效舞台 */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div
            role="button"
            tabIndex={0}
            onClick={handlePetClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handlePetClick()
              }
            }}
            className="group relative flex size-36 cursor-pointer items-center justify-center rounded-2xl bg-muted/40 p-2 ring-1 ring-border/50 transition-all hover:bg-muted/70 hover:shadow-inner"
            title="点击触发 Q 弹果冻弹跳"
          >
            <div className="size-24 scale-[1.3] transition-transform duration-200 group-hover:scale-[1.38]">
              <Pet
                shape={shape}
                eyeShape={eyeShape}
                eyeParams={eyeParams}
                emotion={previewEmotion}
                emotionMode="fixed"
                gazeMode={activeScenario === 'tucked' ? 'fixed' : 'follow'}
                fixedGaze={[0, 0]}
                colorMode="theme"
                size={96}
                showShadow={true}
                enableSquishOnClick={true}
                squishSignal={squishSignal}
              />
            </div>
            <span className="absolute right-2 bottom-2 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs backdrop-blur-xs">
              点我 Q 弹
            </span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="font-medium text-foreground text-sm">
                {currentPreset.chineseName}
              </span>
              <span className="font-mono text-muted-foreground text-xs">
                {currentPreset.number}
              </span>
            </div>
            <p className="mt-0.5 max-w-xs text-muted-foreground text-xs">
              {currentPreset.description}
            </p>
          </div>
        </div>

        {/* 右侧场景与模式状态快捷预览 */}
        <div className="flex flex-1 flex-col justify-between gap-4 border-border/50 pt-4 sm:border-l sm:pt-0 sm:pl-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                <Sparkles className="size-3.5 text-primary" />
                交互场景表情即时预览
              </span>
              <div className="flex gap-1.5">
                <Badge variant="secondary" className="font-normal text-[11px]">
                  {eyeShapeMode === 'random' ? '眼型随机' : currentEyeMeta.shortLabel}
                </Badge>
                <Badge variant="secondary" className="font-normal text-[11px]">
                  {emotionMode === 'random' ? '待机随机' : '待机固定'}
                </Badge>
              </div>
            </div>

            <p className="mt-1 text-muted-foreground text-xs">
              点击下方场景，观察宠物在不同交互下的专属表情与眼神反馈：
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {SCENARIO_PREVIEWS.map((item) => {
                const isCurrentActive = activeScenario === item.key
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant={isCurrentActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-9 justify-center text-xs font-normal',
                      isCurrentActive && 'shadow-xs'
                    )}
                    onClick={() => {
                      const nextScenario = isCurrentActive ? null : item.key
                      setActiveScenario(nextScenario)
                      setPreviewEmotion(nextScenario ? scenarioEmotions[nextScenario] : null)
                    }}
                    title={item.desc}
                  >
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            {activeScenario ? (
              <span className="text-primary font-medium">
                正在预览【{SCENARIO_PREVIEWS.find((s) => s.key === activeScenario)?.label}】场景表情
              </span>
            ) : (
              '未激活特定预览时，舞台展示当前待机常态。移动鼠标即可感受眼神视线跟随。'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
