import {
  Button,
  cn,
  Input,
  Label,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@zen/ui'
import { Check, RotateCcw, Sparkles } from 'lucide-react'
import { useRef } from 'react'

import { PRESET_PET_COLORS } from '../constants/colors'
import {
  CAPSULE_PRESETS,
  DEFAULT_EYE_PARAMS,
  EMOTIONS_CATALOG,
  EYE_SHAPES_CATALOG
} from '../constants/emotions'
import { GAZE_PRESETS } from '../constants/gazes'
import { PRESET_PETS } from '../constants/pets-data'
import { usePetsStore } from '../stores/use-pets-store'
import { PetAvatar } from './pet-avatar'

import type { PetDefinition, PetEyeParamsMap, PetEyeShape } from '../types'

export function PetEditSheet() {
  const editingPetId = usePetsStore((s) => s.editingPetId)
  const setEditingPetId = usePetsStore((s) => s.setEditingPetId)
  const configs = usePetsStore((s) => s.configs)
  const globalConfig = usePetsStore((s) => s.globalConfig)
  const updatePetConfig = usePetsStore((s) => s.updatePetConfig)
  const updatePetEyeParam = usePetsStore((s) => s.updatePetEyeParam)
  const resetPetConfig = usePetsStore((s) => s.resetPetConfig)

  const lastPetRef = useRef<PetDefinition>(PRESET_PETS[0]!)
  const currentPet = PRESET_PETS.find((p) => p.id === editingPetId)
  if (currentPet) {
    lastPetRef.current = currentPet
  }
  const pet = currentPet || lastPetRef.current
  const config = pet && configs[pet.id] ? configs[pet.id]! : globalConfig

  const activeShape = config.eyeShape ?? 'capsule'
  const eyeParams = {
    ...DEFAULT_EYE_PARAMS,
    ...(config.eyeParams ?? {})
  }

  const isOpen = Boolean(editingPetId)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && setEditingPetId(null)}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg overflow-y-auto">
        {/* 抽屉头部 */}
        <SheetHeader className="border-b border-border/60 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary">{pet.number}</span>
            <SheetTitle className="text-lg font-semibold">
              调配 {pet.name} · {pet.chineseName}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            单独定制此宠物的色彩、眼睛形状与细化参数、表情状态及视线交互。
          </SheetDescription>
        </SheetHeader>

        {/* 顶部实时大图预览区 */}
        <div className="relative flex h-56 w-full items-center justify-center border-b border-border/40 bg-muted/20 dark:bg-white/2">
          <PetAvatar pet={pet} config={config} width={190} height={190} />
          <div className="absolute bottom-2 right-4 flex items-center gap-1 text-[11px] text-muted-foreground bg-background/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-border/40">
            <Sparkles className="size-3 text-primary" />
            <span>实时视窗</span>
          </div>
        </div>

        {/* 配置表单区 */}
        <div className="flex-1 space-y-6 px-6 py-5">
          {/* 1. 色彩编辑 */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              机身色彩
            </Label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { colorMode: 'theme' })}
                className={cn(
                  'flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                  config.colorMode === 'theme'
                    ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                    : 'border-border/60 bg-background hover:bg-muted/50'
                )}
              >
                <span className="size-4 rounded-full border border-primary/40 bg-primary mb-1.5" />
                <span className="text-xs">跟随品牌色</span>
              </button>

              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { colorMode: 'preset' })}
                className={cn(
                  'flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                  config.colorMode === 'preset'
                    ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                    : 'border-border/60 bg-background hover:bg-muted/50'
                )}
              >
                <span className="size-4 rounded-full bg-linear-to-tr from-emerald-400 via-pink-400 to-sky-400 mb-1.5" />
                <span className="text-xs">预设色板</span>
              </button>

              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { colorMode: 'custom' })}
                className={cn(
                  'flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                  config.colorMode === 'custom'
                    ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                    : 'border-border/60 bg-background hover:bg-muted/50'
                )}
              >
                <span
                  className="size-4 rounded-full border border-border mb-1.5"
                  style={{ backgroundColor: config.customColor || '#34D399' }}
                />
                <span className="text-xs">自定义取色</span>
              </button>
            </div>

            {config.colorMode === 'preset' && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2">
                <span className="text-[11px] text-muted-foreground block">选择流行预设色：</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PET_COLORS.map((c) => {
                    const isSelected = config.customColor === c.hex
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updatePetConfig(pet.id, { customColor: c.hex })}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs transition-all cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/15 font-medium ring-1 ring-primary/30'
                            : 'border-border/60 bg-background hover:border-border'
                        )}
                      >
                        <span
                          className="size-3.5 rounded-full border border-black/10 flex items-center justify-center"
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && <Check className="size-2.5 text-white stroke-3" />}
                        </span>
                        <span>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {config.colorMode === 'custom' && (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
                <input
                  type="color"
                  value={config.customColor || '#34D399'}
                  onChange={(e) => updatePetConfig(pet.id, { customColor: e.target.value })}
                  className="size-9 cursor-pointer rounded-xl border border-border bg-transparent p-0.5"
                />
                <div className="flex-1">
                  <Input
                    value={config.customColor || '#34D399'}
                    onChange={(e) => updatePetConfig(pet.id, { customColor: e.target.value })}
                    placeholder="#34D399"
                    className="h-8 font-mono text-xs uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/60 dark:bg-white/10" />

          {/* 2. 维度一：眼睛形状底胚 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                眼睛形状 (Eye Shape)
              </Label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {EYE_SHAPES_CATALOG.map((item) => {
                const isSelected = activeShape === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updatePetConfig(pet.id, { eyeShape: item.id })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs text-left transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                        : 'border-border/60 bg-background hover:bg-muted/40'
                    )}
                  >
                    <span className="line-clamp-1">{item.shortLabel}</span>
                  </button>
                )
              })}
            </div>

            {/* 当前眼型的微调参数 */}
            <SheetShapeRefineBox
              petId={pet.id}
              activeShape={activeShape}
              eyeParams={eyeParams}
              onUpdateParam={updatePetEyeParam}
            />
          </div>

          <Separator className="bg-border/60 dark:bg-white/10" />

          {/* 3. 维度二：表情动作状态 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                表情动作 (Emotion)
              </Label>
            </div>

            <div className="flex rounded-xl bg-muted/50 p-1 border border-border/50">
              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { emotionMode: 'fixed' })}
                className={cn(
                  'flex-1 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer',
                  config.emotionMode === 'fixed'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                固定表情
              </button>
              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { emotionMode: 'random' })}
                className={cn(
                  'flex-1 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer',
                  config.emotionMode === 'random'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                定时随机变换
              </button>
            </div>

            {config.emotionMode === 'fixed' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {EMOTIONS_CATALOG.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updatePetConfig(pet.id, { fixedEmotion: item.id })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs text-left transition-all cursor-pointer',
                      (config.fixedEmotion ?? 'normal') === item.id
                        ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                        : 'border-border/60 bg-background hover:bg-muted/40'
                    )}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <span className="line-clamp-1">{item.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2">
                <span className="text-[11px] text-muted-foreground">随机切换时间间隔：</span>
                <div className="flex gap-2 mt-1">
                  {[2, 3, 4, 6, 8].map((sec) => (
                    <Button
                      key={sec}
                      type="button"
                      variant={(config.randomEmotionInterval ?? 4) === sec ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs flex-1 cursor-pointer"
                      onClick={() => updatePetConfig(pet.id, { randomEmotionInterval: sec })}
                    >
                      {sec}秒
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/60 dark:bg-white/10" />

          {/* 4. 视向朝向 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                视向朝向
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {config.gazeMode === 'follow'
                  ? '跟随鼠标'
                  : config.gazeMode === 'fixed'
                    ? '固定方位'
                    : `每 ${config.randomGazeInterval ?? 3}s 随机`}
              </span>
            </div>

            <div className="flex rounded-xl bg-muted/50 p-1 border border-border/50">
              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { gazeMode: 'follow' })}
                className={cn(
                  'flex-1 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer',
                  config.gazeMode === 'follow'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                跟随鼠标
              </button>
              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { gazeMode: 'fixed' })}
                className={cn(
                  'flex-1 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer',
                  config.gazeMode === 'fixed'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                固定朝向
              </button>
              <button
                type="button"
                onClick={() => updatePetConfig(pet.id, { gazeMode: 'random' })}
                className={cn(
                  'flex-1 rounded-lg py-1 text-xs font-medium transition-all cursor-pointer',
                  config.gazeMode === 'random'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                定时随机
              </button>
            </div>

            {config.gazeMode === 'fixed' && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {GAZE_PRESETS.map((preset) => {
                    const isSelected =
                      config.fixedGaze?.[0] === preset.vector[0] &&
                      config.fixedGaze?.[1] === preset.vector[1]
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => updatePetConfig(pet.id, { fixedGaze: preset.vector })}
                        title={preset.tooltip}
                        className={cn(
                          'flex items-center justify-center gap-1 rounded-xl border py-1.5 text-xs transition-all cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                            : 'border-border/60 bg-background hover:bg-muted/40'
                        )}
                      >
                        <span>{preset.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部重置与关闭栏 */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-border/60 bg-background/95 backdrop-blur-md px-6 py-3 dark:border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetPetConfig(pet.id)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            恢复默认预设
          </Button>

          <Button
            size="sm"
            onClick={() => setEditingPetId(null)}
            className="px-5 text-xs cursor-pointer"
          >
            完成
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SheetShapeRefineBox({
  petId,
  activeShape,
  eyeParams,
  onUpdateParam
}: {
  petId: string
  activeShape: PetEyeShape
  eyeParams: PetEyeParamsMap
  onUpdateParam: <K extends PetEyeShape>(
    petId: string,
    shape: K,
    key: keyof PetEyeParamsMap[K],
    value: number
  ) => void
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
      {activeShape === 'capsule' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">长度:</span>
            <input
              type="range"
              min="14"
              max="42"
              step="0.5"
              value={eyeParams.capsule.height}
              onChange={(e) =>
                onUpdateParam(petId, 'capsule', 'height', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">
              {eyeParams.capsule.height}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">宽度:</span>
            <input
              type="range"
              min="9"
              max="22"
              step="0.5"
              value={eyeParams.capsule.width}
              onChange={(e) =>
                onUpdateParam(petId, 'capsule', 'width', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">{eyeParams.capsule.width}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onUpdateParam(petId, 'capsule', 'height', CAPSULE_PRESETS.subtle.height)
                onUpdateParam(petId, 'capsule', 'width', CAPSULE_PRESETS.subtle.width)
              }}
              className="px-2 py-1 rounded-md bg-background border border-border/60 hover:bg-muted text-[11px] flex-1 cursor-pointer"
            >
              微胶囊 (15×19)
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateParam(petId, 'capsule', 'height', CAPSULE_PRESETS.tall.height)
                onUpdateParam(petId, 'capsule', 'width', CAPSULE_PRESETS.tall.width)
              }}
              className="px-2 py-1 rounded-md bg-background border border-border/60 hover:bg-muted text-[11px] flex-1 cursor-pointer"
            >
              长胶囊 (14.5×36)
            </button>
          </div>
        </div>
      )}

      {activeShape === 'dot' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">豆豆眼半径:</span>
          <input
            type="range"
            min="4"
            max="14"
            step="0.5"
            value={eyeParams.dot.radius}
            onChange={(e) =>
              onUpdateParam(petId, 'dot', 'radius', Number.parseFloat(e.target.value))
            }
            className="flex-1 accent-primary"
          />
          <span className="font-mono text-primary w-8 text-right">{eyeParams.dot.radius}</span>
        </div>
      )}

      {activeShape === 'sparkle' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">瞳孔高度:</span>
            <input
              type="range"
              min="16"
              max="30"
              step="0.5"
              value={eyeParams.sparkle.height}
              onChange={(e) =>
                onUpdateParam(petId, 'sparkle', 'height', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">
              {eyeParams.sparkle.height}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">瞳孔宽度:</span>
            <input
              type="range"
              min="12"
              max="24"
              step="0.5"
              value={eyeParams.sparkle.width}
              onChange={(e) =>
                onUpdateParam(petId, 'sparkle', 'width', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">{eyeParams.sparkle.width}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">高光斑缩放:</span>
            <input
              type="range"
              min="0.5"
              max="1.6"
              step="0.1"
              value={eyeParams.sparkle.hlScale}
              onChange={(e) =>
                onUpdateParam(petId, 'sparkle', 'hlScale', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">
              {eyeParams.sparkle.hlScale}x
            </span>
          </div>
        </div>
      )}

      {activeShape === 'cat' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">梭形高度:</span>
            <input
              type="range"
              min="8"
              max="22"
              step="0.5"
              value={eyeParams.cat.height}
              onChange={(e) =>
                onUpdateParam(petId, 'cat', 'height', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">{eyeParams.cat.height}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">尖锐曲率:</span>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={eyeParams.cat.sharpness}
              onChange={(e) =>
                onUpdateParam(petId, 'cat', 'sharpness', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">{eyeParams.cat.sharpness}</span>
          </div>
        </div>
      )}

      {activeShape === 'cyber-bar' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">横向宽度:</span>
            <input
              type="range"
              min="14"
              max="32"
              step="0.5"
              value={eyeParams['cyber-bar'].width}
              onChange={(e) =>
                onUpdateParam(petId, 'cyber-bar', 'width', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">
              {eyeParams['cyber-bar'].width}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">横条厚度:</span>
            <input
              type="range"
              min="5"
              max="16"
              step="0.5"
              value={eyeParams['cyber-bar'].height}
              onChange={(e) =>
                onUpdateParam(petId, 'cyber-bar', 'height', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">
              {eyeParams['cyber-bar'].height}
            </span>
          </div>
        </div>
      )}

      {activeShape === 'squircle' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">边长大小:</span>
            <input
              type="range"
              min="10"
              max="24"
              step="0.5"
              value={eyeParams.squircle.size}
              onChange={(e) =>
                onUpdateParam(petId, 'squircle', 'size', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">{eyeParams.squircle.size}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">方圆倒角:</span>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={eyeParams.squircle.radius}
              onChange={(e) =>
                onUpdateParam(petId, 'squircle', 'radius', Number.parseFloat(e.target.value))
              }
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-primary w-8 text-right">
              {eyeParams.squircle.radius}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
