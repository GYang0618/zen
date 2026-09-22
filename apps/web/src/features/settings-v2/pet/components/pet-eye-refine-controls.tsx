import { Button } from '@zen/ui'
import { RotateCcw, Sliders } from 'lucide-react'
import { toast } from 'sonner'

import { useAgentPetStore } from '@/features/agent'
import { CAPSULE_PRESETS, DEFAULT_EYE_PARAMS, EYE_SHAPES_CATALOG } from '@/features/pets'

import type { PetEyeParamsMap, PetEyeShape } from '@/features/pets'

interface ParamSliderRowProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  unit?: string
  onChange: (value: number) => void
}

function ParamSliderRow({
  label,
  min,
  max,
  step,
  value,
  unit = '',
  onChange
}: ParamSliderRowProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number.parseFloat(e.target.value))}
          className="h-1.5 w-36 sm:w-48 cursor-pointer rounded-lg bg-muted accent-primary transition-all"
        />
        <span className="w-12 text-right font-mono text-primary text-xs">
          {value}
          {unit}
        </span>
      </div>
    </div>
  )
}

export function PetEyeRefineControls() {
  const eyeShape = useAgentPetStore((s) => s.eyeShape)
  const eyeParams = useAgentPetStore((s) => s.eyeParams)
  const setEyeParam = useAgentPetStore((s) => s.setEyeParam)
  const resetEyeParams = useAgentPetStore((s) => s.resetEyeParams)

  const currentEyeMeta = EYE_SHAPES_CATALOG.find((e) => e.id === eyeShape) ?? EYE_SHAPES_CATALOG[0]!

  const isShapeDefault = (() => {
    const current = eyeParams[eyeShape]
    const def = DEFAULT_EYE_PARAMS[eyeShape]
    return Object.keys(def).every(
      (k) => current[k as keyof typeof current] === def[k as keyof typeof def]
    )
  })()

  const handleResetShape = () => {
    if (isShapeDefault) return
    resetEyeParams(eyeShape)
    toast.success(`已重置【${currentEyeMeta.shortLabel}】细化参数为默认`)
  }

  const updateParam = <K extends PetEyeShape>(
    shape: K,
    key: keyof PetEyeParamsMap[K],
    val: number
  ) => {
    setEyeParam(shape, key, val)
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-primary" />
          <span className="font-medium text-foreground text-xs">
            当前眼型（{currentEyeMeta.shortLabel}）细化微调
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isShapeDefault}
          onClick={handleResetShape}
          className="h-7 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="mr-1.5 size-3" />
          重置当前眼型参数
        </Button>
      </div>

      {/* 1. 微胶囊眼 (capsule) */}
      {eyeShape === 'capsule' && (
        <div className="space-y-3">
          <ParamSliderRow
            label="眼孔长度 (高度)"
            min={14}
            max={42}
            step={0.5}
            value={eyeParams.capsule.height}
            onChange={(v) => updateParam('capsule', 'height', v)}
          />
          <ParamSliderRow
            label="眼孔宽度"
            min={9}
            max={22}
            step={0.5}
            value={eyeParams.capsule.width}
            onChange={(v) => updateParam('capsule', 'width', v)}
          />

          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <span className="text-[11px] text-muted-foreground">经典比例模板：</span>
            <button
              type="button"
              onClick={() => {
                updateParam('capsule', 'height', CAPSULE_PRESETS.subtle.height)
                updateParam('capsule', 'width', CAPSULE_PRESETS.subtle.width)
              }}
              className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-[11px] text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              微胶囊 (15×19)
            </button>
            <button
              type="button"
              onClick={() => {
                updateParam('capsule', 'height', CAPSULE_PRESETS.tall.height)
                updateParam('capsule', 'width', CAPSULE_PRESETS.tall.width)
              }}
              className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-[11px] text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              长胶囊 (14.5×36)
            </button>
          </div>
        </div>
      )}

      {/* 2. 豆豆眼 (dot) */}
      {eyeShape === 'dot' && (
        <div className="space-y-3">
          <ParamSliderRow
            label="豆豆眼半径"
            min={4}
            max={14}
            step={0.5}
            value={eyeParams.dot.radius}
            onChange={(v) => updateParam('dot', 'radius', v)}
          />
        </div>
      )}

      {/* 3. 高光双瞳眼 (sparkle) */}
      {eyeShape === 'sparkle' && (
        <div className="space-y-3">
          <ParamSliderRow
            label="双瞳高度"
            min={16}
            max={30}
            step={0.5}
            value={eyeParams.sparkle.height}
            onChange={(v) => updateParam('sparkle', 'height', v)}
          />
          <ParamSliderRow
            label="双瞳宽度"
            min={12}
            max={24}
            step={0.5}
            value={eyeParams.sparkle.width}
            onChange={(v) => updateParam('sparkle', 'width', v)}
          />
          <ParamSliderRow
            label="高光斑缩放倍率"
            min={0.5}
            max={1.6}
            step={0.1}
            unit="x"
            value={eyeParams.sparkle.hlScale}
            onChange={(v) => updateParam('sparkle', 'hlScale', v)}
          />
        </div>
      )}

      {/* 4. 猫咪梭形眼 (cat) */}
      {eyeShape === 'cat' && (
        <div className="space-y-3">
          <ParamSliderRow
            label="梭形高度"
            min={8}
            max={22}
            step={0.5}
            value={eyeParams.cat.height}
            onChange={(v) => updateParam('cat', 'height', v)}
          />
          <ParamSliderRow
            label="尖锐曲率"
            min={0.1}
            max={0.6}
            step={0.05}
            value={eyeParams.cat.sharpness}
            onChange={(v) => updateParam('cat', 'sharpness', v)}
          />
        </div>
      )}

      {/* 5. 数码横条眼 (cyber-bar) */}
      {eyeShape === 'cyber-bar' && (
        <div className="space-y-3">
          <ParamSliderRow
            label="横向宽度"
            min={14}
            max={32}
            step={0.5}
            value={eyeParams['cyber-bar'].width}
            onChange={(v) => updateParam('cyber-bar', 'width', v)}
          />
          <ParamSliderRow
            label="横条厚度"
            min={5}
            max={16}
            step={0.5}
            value={eyeParams['cyber-bar'].height}
            onChange={(v) => updateParam('cyber-bar', 'height', v)}
          />
        </div>
      )}

      {/* 6. 像素方圆眼 (squircle) */}
      {eyeShape === 'squircle' && (
        <div className="space-y-3">
          <ParamSliderRow
            label="方圆边长"
            min={10}
            max={24}
            step={0.5}
            value={eyeParams.squircle.size}
            onChange={(v) => updateParam('squircle', 'size', v)}
          />
          <ParamSliderRow
            label="倒角圆角"
            min={1}
            max={8}
            step={0.5}
            value={eyeParams.squircle.radius}
            onChange={(v) => updateParam('squircle', 'radius', v)}
          />
        </div>
      )}
    </div>
  )
}
