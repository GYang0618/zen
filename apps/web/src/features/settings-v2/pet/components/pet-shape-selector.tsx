import { Badge, cn } from '@zen/ui'
import { Check } from 'lucide-react'

import { useAgentPetStore } from '@/features/agent'
import { Pet, PRESET_PETS } from '@/features/pets'

export function PetShapeSelector() {
  const shape = useAgentPetStore((s) => s.shape)
  const setShape = useAgentPetStore((s) => s.setShape)
  const eyeShape = useAgentPetStore((s) => s.eyeShape)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {PRESET_PETS.map((pet) => {
        const isSelected = shape === pet.id

        return (
          <button
            key={pet.id}
            type="button"
            onClick={() => setShape(pet.id)}
            className={cn(
              'group relative flex flex-col items-center justify-between rounded-xl border p-3 text-center transition-all cursor-pointer select-none',
              'hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary/50 shadow-xs'
                : 'border-border/60 bg-card/60'
            )}
            aria-pressed={isSelected}
          >
            {/* 选中徽标 */}
            {isSelected && (
              <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-2.5 stroke-[3]" />
              </span>
            )}

            {/* 顶部编号标签 */}
            <div className="flex w-full items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">{pet.number}</span>
              {pet.tag && (
                <Badge variant="outline" className="px-1 py-0 text-[9px] leading-tight">
                  {pet.tag}
                </Badge>
              )}
            </div>

            {/* 中间宠物微缩图标 */}
            <div className="my-2 flex size-14 items-center justify-center transition-transform group-hover:scale-105">
              <Pet
                shape={pet.id}
                eyeShape={eyeShape}
                emotion="normal"
                emotionMode="fixed"
                gazeMode="fixed"
                fixedGaze={[0, 0]}
                colorMode="theme"
                size={54}
                showShadow={false}
                enableSquishOnClick={false}
              />
            </div>

            {/* 底部名称与说明 */}
            <div className="w-full">
              <div className="font-medium text-foreground text-xs">{pet.chineseName}</div>
              <div className="mt-0.5 truncate text-[10px] text-muted-foreground" title={pet.name}>
                {pet.name}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
