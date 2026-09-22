import { cn, RadioGroup, RadioGroupItem } from '@zen/ui'
import { Check, Dices, Lock } from 'lucide-react'

import { useAgentPetStore } from '@/features/agent'
import { EYE_SHAPES_CATALOG } from '@/features/pets'

import { PetEyeRefineControls } from './pet-eye-refine-controls'

import type { PetBehaviorMode } from '@/features/agent'
import type { PetEyeShape } from '@/features/pets'

export function PetEyeSettings() {
  const eyeShape = useAgentPetStore((s) => s.eyeShape)
  const setEyeShape = useAgentPetStore((s) => s.setEyeShape)
  const eyeShapeMode = useAgentPetStore((s) => s.eyeShapeMode)
  const setEyeShapeMode = useAgentPetStore((s) => s.setEyeShapeMode)

  return (
    <div className="space-y-4">
      {/* 变幻模式选择 */}
      <div>
        <div className="mb-2 font-medium text-foreground text-xs">变幻模式</div>
        <RadioGroup
          value={eyeShapeMode}
          onValueChange={(val) => {
            if (val) setEyeShapeMode(val as PetBehaviorMode)
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-xl"
        >
          <label
            htmlFor="eye-mode-fixed"
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
              'hover:border-foreground/20 hover:bg-muted/30',
              eyeShapeMode === 'fixed'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                : 'border-border/60 bg-card/60'
            )}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="size-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">固定所选眼型</span>
                <RadioGroupItem value="fixed" id="eye-mode-fixed" className="sr-only" />
              </div>
              <p className="mt-0.5 text-muted-foreground text-xs">
                始终保持自选的基础眼型轮廓，保持专注与一致的特质。
              </p>
            </div>
          </label>

          <label
            htmlFor="eye-mode-random"
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
              'hover:border-foreground/20 hover:bg-muted/30',
              eyeShapeMode === 'random'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                : 'border-border/60 bg-card/60'
            )}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Dices className="size-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">待机随机变幻</span>
                <RadioGroupItem value="random" id="eye-mode-random" className="sr-only" />
              </div>
              <p className="mt-0.5 text-muted-foreground text-xs">
                待机期间伴随拟真呼吸随机轮换不同眼型，灵动生动。
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* 基础眼型选择 */}
      <div>
        <div className="mb-2 font-medium text-foreground text-xs">基础眼型选择</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {EYE_SHAPES_CATALOG.map((shapeItem) => {
            const isSelected = eyeShape === shapeItem.id

            return (
              <button
                key={shapeItem.id}
                type="button"
                onClick={() => {
                  setEyeShape(shapeItem.id as PetEyeShape)
                  setEyeShapeMode('fixed')
                }}
                className={cn(
                  'group relative flex flex-col items-center justify-between rounded-xl border p-3 text-center transition-all cursor-pointer select-none',
                  'hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/50 shadow-xs'
                    : 'border-border/60 bg-card/60'
                )}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                )}

                <div className="my-2 text-2xl transition-transform group-hover:scale-110">
                  {shapeItem.emoji}
                </div>

                <div className="w-full">
                  <div className="font-medium text-foreground text-xs">{shapeItem.shortLabel}</div>
                  <div
                    className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground"
                    title={shapeItem.description}
                  >
                    {shapeItem.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 眼型细化参数微调 */}
      <PetEyeRefineControls />
    </div>
  )
}
