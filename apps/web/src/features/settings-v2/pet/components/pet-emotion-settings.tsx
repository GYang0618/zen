import { cn, RadioGroup, RadioGroupItem } from '@zen/ui'
import { Check, Sparkles, UserCheck } from 'lucide-react'

import { useAgentPetStore } from '@/features/agent'
import { EMOTIONS_CATALOG } from '@/features/pets'

import type { PetBehaviorMode } from '@/features/agent'
import type { PetEmotion } from '@/features/pets'

export function PetEmotionSettings() {
  const emotionMode = useAgentPetStore((s) => s.emotionMode)
  const setEmotionMode = useAgentPetStore((s) => s.setEmotionMode)
  const idleEmotion = useAgentPetStore((s) => s.scenarioEmotions.idle)
  const setScenarioEmotion = useAgentPetStore((s) => s.setScenarioEmotion)
  const setPreviewEmotion = useAgentPetStore((s) => s.setPreviewEmotion)

  return (
    <div className="space-y-4">
      {/* 待机表情模式 */}
      <div>
        <div className="mb-2 font-medium text-foreground text-xs">表情轮换模式</div>
        <RadioGroup
          value={emotionMode}
          onValueChange={(val) => {
            if (val) setEmotionMode(val as PetBehaviorMode)
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-xl"
        >
          <label
            htmlFor="emotion-mode-random"
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
              'hover:border-foreground/20 hover:bg-muted/30',
              emotionMode === 'random'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                : 'border-border/60 bg-card/60'
            )}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">拟真随机轮换</span>
                <RadioGroupItem value="random" id="emotion-mode-random" className="sr-only" />
              </div>
              <p className="mt-0.5 text-muted-foreground text-xs">
                以自然常态为主导，伴随呼吸周期动态穿插眨眼、微笑等生动微表情。
              </p>
            </div>
          </label>

          <label
            htmlFor="emotion-mode-fixed"
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
              'hover:border-foreground/20 hover:bg-muted/30',
              emotionMode === 'fixed'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                : 'border-border/60 bg-card/60'
            )}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="size-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">固定单一表情</span>
                <RadioGroupItem value="fixed" id="emotion-mode-fixed" className="sr-only" />
              </div>
              <p className="mt-0.5 text-muted-foreground text-xs">
                在待机状态下始终保持所选定的固定表情，沉稳专注。
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* 待机常态表情 */}
      <div>
        <div className="mb-2 font-medium text-foreground text-xs">
          待机常态表情选择（随机模式下作为基准基线）
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-9">
          {EMOTIONS_CATALOG.map((emo) => {
            const isSelected = idleEmotion === emo.id

            return (
              <button
                key={emo.id}
                type="button"
                onClick={() => {
                  setScenarioEmotion('idle', emo.id as PetEmotion)
                  setEmotionMode('fixed')
                  setPreviewEmotion(emo.id as PetEmotion)
                  setTimeout(() => {
                    if (useAgentPetStore.getState().previewEmotion === emo.id) {
                      setPreviewEmotion(null)
                    }
                  }, 2500)
                }}
                className={cn(
                  'group relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer select-none',
                  'hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/50 shadow-xs'
                    : 'border-border/60 bg-card/60'
                )}
                aria-pressed={isSelected}
                title={emo.description}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2 stroke-[3]" />
                  </span>
                )}

                <div className="my-1.5 text-xl transition-transform group-hover:scale-115">
                  {emo.emoji}
                </div>

                <div className="font-medium text-foreground text-xs">{emo.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
