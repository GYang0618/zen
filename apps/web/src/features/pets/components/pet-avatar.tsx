import { cn } from '@zen/ui'
import { useEffect, useRef, useState } from 'react'

import { usePetRuntime } from '../hooks/use-pet-runtime'
import { PetEyeSystem } from './pet-eye-system'

import type { PetConfig, PetDefinition } from '../types'

interface PetAvatarProps {
  pet: PetDefinition
  config: PetConfig
  blinkSignal?: number
  className?: string
  width?: number
  height?: number
  /** 点击时是否触发 Q 弹果冻动画 */
  enableSquishOnClick?: boolean
  /** 外部获取当前透视比例 HUD 文本回调 */
  onPerspectiveUpdate?: (text: string) => void
}

export function PetAvatar({
  pet,
  config,
  blinkSignal = 0,
  className,
  width = 180,
  height = 180,
  enableSquishOnClick = true,
  onPerspectiveUpdate
}: PetAvatarProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [isSquishing, setIsSquishing] = useState(false)
  const [internalBlink, setInternalBlink] = useState(0)

  const runtime = usePetRuntime({
    config,
    svgRef,
    headCenter: pet.headCenter,
    isXiaohei: pet.features?.isXiaohei,
    blinkSignal: blinkSignal + internalBlink
  })

  // 同步透视比例文本给父级卡片 HUD 显示（放入 useEffect 避免在渲染期间触发上层组件 setState）
  useEffect(() => {
    if (onPerspectiveUpdate) {
      const text = `L:${Math.round(runtime.depthScaleL * 100)}% R:${Math.round(runtime.depthScaleR * 100)}%`
      onPerspectiveUpdate(text)
    }
  }, [onPerspectiveUpdate, runtime.depthScaleL, runtime.depthScaleR])

  const handleClick = () => {
    if (enableSquishOnClick) {
      setIsSquishing(false)
      requestAnimationFrame(() => {
        setIsSquishing(true)
        setTimeout(() => setIsSquishing(false), 420)
      })
    }
    setInternalBlink((c) => c + 1)
  }

  const animationClass =
    pet.animationType === 'float'
      ? 'animate-[petFloat_3.2s_ease-in-out_infinite]'
      : 'animate-[petBreathe_4s_ease-in-out_infinite]'

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative flex items-center justify-center select-none cursor-pointer outline-hidden',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* 注入全局微动效 CSS Keyframes */}
      <style>{`
        @keyframes petBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.025, 0.985) translateY(-3px); }
        }
        @keyframes petFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes squishBounce {
          0% { transform: scale(1, 1); }
          30% { transform: scale(1.16, 0.82); }
          60% { transform: scale(0.92, 1.10); }
          100% { transform: scale(1, 1); }
        }
        .squish-click {
          animation: squishBounce 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        @keyframes spin-dizzy-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-dizzy-ccw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes pulse-woozy {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
      `}</style>

      {/* 底部微漫反射拟真阴影 */}
      <div className="absolute bottom-3 w-32 h-3.5 bg-black/20 dark:bg-black/60 rounded-full blur-md pointer-events-none" />

      {/* 宠物主 SVG */}
      <svg
        ref={svgRef}
        className={cn(
          'transition-transform duration-200 drop-shadow-md dark:drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]',
          isSquishing && 'squish-click'
        )}
        width={width}
        height={height}
        viewBox={pet.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={
          {
            '--pet-body-color': runtime.bodyColor,
            '--pet-eye-color': runtime.eyeColor,
            '--pet-stroke-color': runtime.bodyColor,
            '--pet-blush-color': runtime.blushColor
          } as React.CSSProperties
        }
      >
        <title>
          {pet.name} · {pet.chineseName}
        </title>
        <g
          className={animationClass}
          style={{
            transformOrigin: `${pet.headCenter.x}px ${pet.headCenter.y}px`
          }}
        >
          {/* 机身形体 */}
          {pet.renderBody({
            bodyFillClass: '[fill:var(--pet-body-color)] transition-[fill] duration-300',
            bodyStrokeClass: '[stroke:var(--pet-body-color)] transition-[stroke] duration-300',
            gaze: {
              gazeX: runtime.gazeX,
              gazeY: runtime.gazeY
            }
          })}

          {/* 眼睛系统 */}
          <PetEyeSystem runtime={runtime} hasBaymaxBridge={pet.features?.hasBaymaxBridge} />
        </g>
      </svg>
    </div>
  )
}
