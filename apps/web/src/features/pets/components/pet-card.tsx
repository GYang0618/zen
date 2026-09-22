import { Badge, Button, cn } from '@zen/ui'
import { Code, Settings2 } from 'lucide-react'
import { useState } from 'react'

import { EYE_SHAPES_CATALOG } from '../constants/emotions'
import { usePetsStore } from '../stores/use-pets-store'
import { PetAvatar } from './pet-avatar'

import type { PetConfig, PetDefinition } from '../types'

interface PetCardProps {
  pet: PetDefinition
  config: PetConfig
}

export function PetCard({ pet, config }: PetCardProps) {
  const [hudScale, setHudScale] = useState('L:100% R:100%')
  const setEditingPetId = usePetsStore((s) => s.setEditingPetId)
  const setCodePetId = usePetsStore((s) => s.setCodePetId)
  const blinkSignal = usePetsStore((s) => s.blinkSignal)

  const isCustomized =
    config.colorMode !== 'theme' ||
    config.gazeMode !== 'follow' ||
    config.eyeShape !== 'capsule' ||
    config.emotionMode !== 'fixed' ||
    config.fixedEmotion !== 'normal'

  const shapeMeta = EYE_SHAPES_CATALOG.find((s) => s.id === (config.eyeShape ?? 'capsule'))

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 transition-all duration-300',
        'border border-border/70 bg-card/60 backdrop-blur-xl shadow-xs',
        'hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5',
        'dark:border-white/10 dark:bg-white/3 dark:hover:border-white/20 dark:hover:bg-white/6 dark:hover:shadow-2xl dark:hover:shadow-black/50'
      )}
    >
      {/* 头部元信息与操作按钮 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-muted-foreground">
              {pet.number} / {pet.tag}
            </span>
            {isCustomized && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                已调配
              </Badge>
            )}
          </div>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
            {pet.name}{' '}
            <span className="text-sm font-normal text-muted-foreground">· {pet.chineseName}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 编辑调配配置按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs gap-1 cursor-pointer font-medium shadow-2xs"
            title="定制此宠物的色彩、眼睛形状与表情"
            onClick={(e) => {
              e.stopPropagation()
              setEditingPetId(pet.id)
            }}
          >
            <Settings2 className="size-3.5" />
            <span>调配</span>
          </Button>

          {/* 查看/复制代码按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="提取 SVG 源码"
            onClick={(e) => {
              e.stopPropagation()
              setCodePetId(pet.id)
            }}
          >
            <Code className="size-3.5" />
            <span className="sr-only">源码</span>
          </Button>
        </div>
      </div>

      {/* 宠物机身核心展示区 */}
      <div className="my-2 flex h-52 items-center justify-center">
        <PetAvatar
          pet={pet}
          config={config}
          blinkSignal={blinkSignal}
          onPerspectiveUpdate={setHudScale}
        />
      </div>

      {/* 底部描述与 HUD 透视指示器 */}
      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground dark:border-white/5">
        <span className="line-clamp-1 pr-2">
          眼型：
          <span className="text-primary font-medium">{shapeMeta?.shortLabel ?? '微胶囊眼'}</span>
        </span>
        <span className="shrink-0 font-mono text-[10px] text-primary" title="双眼动态透视缩放比">
          {hudScale}
        </span>
      </div>
    </div>
  )
}
