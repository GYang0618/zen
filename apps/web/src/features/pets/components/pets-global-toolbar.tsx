import { Button, cn } from '@zen/ui'
import { Dices, Eye, EyeDashed, Palette, Pipette, SlidersHorizontal, Smile } from 'lucide-react'
import { toast } from 'sonner'

import { PRESET_PET_COLORS } from '../constants/colors'
import {
  CAPSULE_PRESETS,
  DEFAULT_EYE_PARAMS,
  EMOTIONS_CATALOG,
  EYE_SHAPES_CATALOG
} from '../constants/emotions'
import { usePetsStore } from '../stores/use-pets-store'

import type { PetEmotion, PetEyeParamsMap, PetEyeShape } from '../types'

export function PetsGlobalToolbar() {
  const globalConfig = usePetsStore((s) => s.globalConfig)
  const batchUpdateAll = usePetsStore((s) => s.batchUpdateAll)
  const updateGlobalEyeParam = usePetsStore((s) => s.updateGlobalEyeParam)
  const triggerGlobalBlink = usePetsStore((s) => s.triggerGlobalBlink)

  const activeShape = globalConfig.eyeShape ?? 'capsule'
  const eyeParams = {
    ...DEFAULT_EYE_PARAMS,
    ...(globalConfig.eyeParams ?? {})
  }

  const handleSetColor = (colorMode: 'theme' | 'preset', customColor?: string, label?: string) => {
    batchUpdateAll({ colorMode, customColor })
    toast.success(`已为全部宠物应用${label ?? '色彩'}模式`)
  }

  const handleSetCustomColor = (hex: string) => {
    batchUpdateAll({ colorMode: 'custom', customColor: hex })
    toast.success(`已为全部宠物应用自定义色彩: ${hex.toUpperCase()}`)
  }

  const handleSetEyeShape = (shape: PetEyeShape, label: string) => {
    batchUpdateAll({ eyeShape: shape })
    toast.success(`已为全部宠物切换眼睛形状: ${label}`)
  }

  const handleSetEmotion = (emotion: PetEmotion, label: string) => {
    batchUpdateAll({ emotionMode: 'fixed', fixedEmotion: emotion })
    toast.success(`已为全部宠物切换表情: ${label}`)
  }

  const handleRandomEmotion = () => {
    batchUpdateAll({ emotionMode: 'random', randomEmotionInterval: 3 })
    toast.success('已开启全部宠物自主随机表情轮换')
  }

  const handleSetGaze = (vector: [number, number], label: string) => {
    batchUpdateAll({ gazeMode: 'fixed', fixedGaze: vector })
    toast.success(`已为全部宠物固定视向: ${label}`)
  }

  const handleFollowGaze = () => {
    batchUpdateAll({ gazeMode: 'follow' })
    toast.success('已恢复全部宠物自由视线跟随')
  }

  const handleRandomGaze = () => {
    batchUpdateAll({ gazeMode: 'random', randomGazeInterval: 2.5 })
    toast.success('已开启全部宠物自主东张西望')
  }

  const applyCapsulePreset = (presetKey: 'subtle' | 'tall') => {
    const preset = CAPSULE_PRESETS[presetKey]
    updateGlobalEyeParam('capsule', 'width', preset.width)
    updateGlobalEyeParam('capsule', 'height', preset.height)
    updateGlobalEyeParam('capsule', 'rxFactor', preset.rxFactor)
    toast.success(
      presetKey === 'subtle'
        ? '已还原胶囊眼为默认微胶囊 (15 × 19)'
        : '已配置胶囊眼为修长胶囊 (14.5 × 36)'
    )
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xl p-4 shadow-xs space-y-3 dark:border-white/10 dark:bg-white/3">
      {/* 1. 顶部色彩调配栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3 dark:border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground">
            <Palette className="size-3.5 text-primary" />
            <span>全局色彩:</span>
          </span>

          <Button
            variant={globalConfig.colorMode === 'theme' ? 'default' : 'outline'}
            size="sm"
            className="h-7 rounded-xl text-xs gap-1.5 cursor-pointer font-medium"
            onClick={() => handleSetColor('theme', undefined, '默认品牌色')}
          >
            <span className="size-2.5 rounded-full border border-primary-foreground/40 bg-primary inline-block" />
            <span>跟随系统品牌色</span>
          </Button>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/40 dark:bg-black/20">
            {PRESET_PET_COLORS.slice(0, 5).map((c) => {
              const isActive =
                globalConfig.colorMode === 'preset' && globalConfig.customColor === c.hex
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSetColor('preset', c.hex, c.label)}
                  title={c.label}
                  className={cn(
                    'size-5 rounded-full border transition-all cursor-pointer hover:scale-115 active:scale-95',
                    isActive
                      ? 'border-primary ring-2 ring-primary/40 scale-110'
                      : 'border-black/10 dark:border-white/10'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              )
            })}
            <span className="w-px h-3.5 bg-border/60 mx-0.5" />
            <div
              className={cn(
                'relative size-5 rounded-full border transition-all cursor-pointer flex items-center justify-center hover:scale-115 active:scale-95 overflow-hidden',
                globalConfig.colorMode === 'custom'
                  ? 'border-primary ring-2 ring-primary/40 scale-110'
                  : 'border-dashed border-muted-foreground/50 hover:border-primary bg-background/50'
              )}
              style={
                globalConfig.colorMode === 'custom'
                  ? { backgroundColor: globalConfig.customColor || '#34D399' }
                  : undefined
              }
              title="自定义拾色"
            >
              <input
                type="color"
                value={globalConfig.customColor || '#34D399'}
                onChange={(e) => handleSetCustomColor(e.target.value)}
                className="absolute inset-0 size-full opacity-0 cursor-pointer"
              />
              {globalConfig.colorMode !== 'custom' && (
                <Pipette className="size-2.5 text-muted-foreground pointer-events-none" />
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerGlobalBlink}
            className="h-7 rounded-xl text-xs gap-1 cursor-pointer"
          >
            <EyeDashed className="size-3 text-primary" />
            <span>全员眨眼</span>
          </Button>
        </div>
      </div>

      {/* 2. 维度一：眼睛形状 */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-xs font-semibold text-primary">1. 眼睛形状:</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium">
            (默认是微胶囊眼)
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {EYE_SHAPES_CATALOG.map((item) => {
            const isActive = activeShape === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSetEyeShape(item.id, item.label)}
                className={cn(
                  'shrink-0 rounded-xl px-2.5 py-1 text-xs transition-all cursor-pointer border flex items-center gap-1',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground font-medium shadow-2xs'
                    : 'border-border/60 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. 动态专属眼型细化参数配置栏 */}
      <ShapeRefineSection
        activeShape={activeShape}
        eyeParams={eyeParams}
        onUpdateParam={updateGlobalEyeParam}
        onApplyCapsulePreset={applyCapsulePreset}
      />

      {/* 4. 维度二：表情动作 */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5 border-t border-border/40 pt-2 dark:border-white/5">
        <span className="flex items-center gap-1 shrink-0 font-mono text-xs font-semibold text-muted-foreground mr-1">
          <Smile className="size-3.5 text-primary" />
          <span>2. 表情状态:</span>
        </span>

        {EMOTIONS_CATALOG.map((item) => {
          const isActive =
            globalConfig.emotionMode === 'fixed' &&
            (globalConfig.fixedEmotion ?? 'normal') === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSetEmotion(item.id, item.label)}
              className={cn(
                'shrink-0 rounded-xl px-2.5 py-1 text-xs transition-all cursor-pointer border flex items-center gap-1',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground font-medium shadow-2xs'
                  : 'border-border/60 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          )
        })}

        <Button
          variant={globalConfig.emotionMode === 'random' ? 'default' : 'outline'}
          size="sm"
          className="h-6 rounded-xl text-xs gap-1 shrink-0 cursor-pointer"
          onClick={handleRandomEmotion}
        >
          <Dices className="size-3" />
          <span>全部随机轮播</span>
        </Button>
      </div>

      {/* 5. 透视视向方位栏 */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pt-2 border-t border-border/40 dark:border-white/5">
        <span className="flex items-center gap-1 shrink-0 font-mono text-xs font-medium text-muted-foreground mr-1">
          <Eye className="size-3.5 text-primary" />
          <span>透视视向:</span>
        </span>

        <button
          type="button"
          onClick={() => handleSetGaze([0, 0], '正视')}
          className="shrink-0 rounded-xl px-2.5 py-1 text-xs border border-border/60 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          正视
        </button>
        <button
          type="button"
          onClick={() => handleSetGaze([-1, 0], '左看 (左小右大)')}
          className="shrink-0 rounded-xl px-2.5 py-1 text-xs border border-border/60 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          左看
        </button>
        <button
          type="button"
          onClick={() => handleSetGaze([1, 0], '右看 (左大右小)')}
          className="shrink-0 rounded-xl px-2.5 py-1 text-xs border border-border/60 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          右看
        </button>
        <button
          type="button"
          onClick={() => handleSetGaze([0.85, -0.85], '右上')}
          className="shrink-0 rounded-xl px-2.5 py-1 text-xs border border-border/60 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          右上 ↗
        </button>

        <Button
          variant={globalConfig.gazeMode === 'follow' ? 'default' : 'outline'}
          size="sm"
          className="h-6 rounded-xl text-xs gap-1 shrink-0 cursor-pointer"
          onClick={handleFollowGaze}
        >
          自由跟随
        </Button>

        <Button
          variant={globalConfig.gazeMode === 'random' ? 'default' : 'outline'}
          size="sm"
          className="h-6 rounded-xl text-xs gap-1 shrink-0 cursor-pointer"
          onClick={handleRandomGaze}
        >
          <Dices className="size-3" />
          <span>随机东张西望</span>
        </Button>
      </div>
    </div>
  )
}

function ShapeRefineSection({
  activeShape,
  eyeParams,
  onUpdateParam,
  onApplyCapsulePreset
}: {
  activeShape: PetEyeShape
  eyeParams: PetEyeParamsMap
  onUpdateParam: <K extends PetEyeShape>(
    shape: K,
    key: keyof PetEyeParamsMap[K],
    value: number
  ) => void
  onApplyCapsulePreset: (preset: 'subtle' | 'tall') => void
}) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto text-xs py-1.5 px-3 rounded-2xl bg-muted/30 border border-border/40 dark:bg-white/3">
      <div className="flex items-center gap-1 shrink-0 text-primary font-mono text-[11px] font-medium">
        <SlidersHorizontal className="size-3" />
        <span>⚙️ 眼型细化:</span>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {activeShape === 'capsule' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">长度(高度):</span>
              <input
                type="range"
                min="14"
                max="42"
                step="0.5"
                value={eyeParams.capsule.height}
                onChange={(e) =>
                  onUpdateParam('capsule', 'height', Number.parseFloat(e.target.value))
                }
                className="w-24 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.capsule.height}</span>
              <button
                type="button"
                onClick={() => onApplyCapsulePreset('subtle')}
                className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/20 text-[10px] text-primary cursor-pointer"
              >
                设为微胶囊
              </button>
              <button
                type="button"
                onClick={() => onApplyCapsulePreset('tall')}
                className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/20 text-[10px] text-foreground cursor-pointer"
              >
                设为长胶囊
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">宽度:</span>
              <input
                type="range"
                min="9"
                max="22"
                step="0.5"
                value={eyeParams.capsule.width}
                onChange={(e) =>
                  onUpdateParam('capsule', 'width', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.capsule.width}</span>
            </div>
          </>
        )}

        {activeShape === 'dot' && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">豆豆眼半径(大小):</span>
            <input
              type="range"
              min="4"
              max="14"
              step="0.5"
              value={eyeParams.dot.radius}
              onChange={(e) => onUpdateParam('dot', 'radius', Number.parseFloat(e.target.value))}
              className="w-28 accent-primary"
            />
            <span className="font-mono text-primary w-8">{eyeParams.dot.radius}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              (正圆仅需控制单一直径大小)
            </span>
          </div>
        )}

        {activeShape === 'sparkle' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">瞳孔高:</span>
              <input
                type="range"
                min="16"
                max="30"
                step="0.5"
                value={eyeParams.sparkle.height}
                onChange={(e) =>
                  onUpdateParam('sparkle', 'height', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.sparkle.height}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">瞳孔宽:</span>
              <input
                type="range"
                min="12"
                max="24"
                step="0.5"
                value={eyeParams.sparkle.width}
                onChange={(e) =>
                  onUpdateParam('sparkle', 'width', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.sparkle.width}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">高光缩放:</span>
              <input
                type="range"
                min="0.5"
                max="1.6"
                step="0.1"
                value={eyeParams.sparkle.hlScale}
                onChange={(e) =>
                  onUpdateParam('sparkle', 'hlScale', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.sparkle.hlScale}x</span>
            </div>
          </>
        )}

        {activeShape === 'cat' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">梭形高度:</span>
              <input
                type="range"
                min="8"
                max="22"
                step="0.5"
                value={eyeParams.cat.height}
                onChange={(e) => onUpdateParam('cat', 'height', Number.parseFloat(e.target.value))}
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.cat.height}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">梭形宽度:</span>
              <input
                type="range"
                min="5"
                max="16"
                step="0.5"
                value={eyeParams.cat.width}
                onChange={(e) => onUpdateParam('cat', 'width', Number.parseFloat(e.target.value))}
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.cat.width}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">尖锐度:</span>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={eyeParams.cat.sharpness}
                onChange={(e) =>
                  onUpdateParam('cat', 'sharpness', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.cat.sharpness}</span>
            </div>
          </>
        )}

        {activeShape === 'cyber-bar' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">横向宽度:</span>
              <input
                type="range"
                min="14"
                max="32"
                step="0.5"
                value={eyeParams['cyber-bar'].width}
                onChange={(e) =>
                  onUpdateParam('cyber-bar', 'width', Number.parseFloat(e.target.value))
                }
                className="w-24 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams['cyber-bar'].width}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">横条厚度:</span>
              <input
                type="range"
                min="5"
                max="16"
                step="0.5"
                value={eyeParams['cyber-bar'].height}
                onChange={(e) =>
                  onUpdateParam('cyber-bar', 'height', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams['cyber-bar'].height}</span>
            </div>
          </>
        )}

        {activeShape === 'squircle' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">边长大小:</span>
              <input
                type="range"
                min="10"
                max="24"
                step="0.5"
                value={eyeParams.squircle.size}
                onChange={(e) =>
                  onUpdateParam('squircle', 'size', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.squircle.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">圆角倒角:</span>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={eyeParams.squircle.radius}
                onChange={(e) =>
                  onUpdateParam('squircle', 'radius', Number.parseFloat(e.target.value))
                }
                className="w-20 accent-primary"
              />
              <span className="font-mono text-primary w-8">{eyeParams.squircle.radius}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
