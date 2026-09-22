import { DEFAULT_EYE_PARAMS } from '../constants/emotions'

import type React from 'react'
import type { PetRuntimeState } from '../hooks/use-pet-runtime'
import type { PetEmotion, PetEyeParamsMap, PetEyeShape } from '../types'

interface PetEyeSystemProps {
  runtime: PetRuntimeState
  hasBaymaxBridge?: boolean
}

/**
 * 基础眼睛形状几何生成器：依据各自专属配置参数与视角形变动态绘制
 */
export function getBaseEyeGeometry(
  shape: PetEyeShape,
  depthScale: number,
  widthShrink: number,
  params: PetEyeParamsMap = DEFAULT_EYE_PARAMS,
  eyeColor = 'var(--pet-eye-color)',
  bodyColor = 'var(--pet-body-color)'
): React.ReactNode {
  switch (shape) {
    case 'dot': {
      // 正圆豆豆眼：仅由单一半径参数控制
      const p = params.dot ?? DEFAULT_EYE_PARAMS.dot
      const r = p.radius * depthScale * Math.min(1.0, widthShrink)
      return <circle cx="0" cy="0" r={r.toFixed(1)} fill={eyeColor} />
    }
    case 'capsule': {
      // 胶囊眼：由宽度、高度/长度、圆角比例动态驱动
      const p = params.capsule ?? DEFAULT_EYE_PARAMS.capsule
      const w = p.width * depthScale * widthShrink
      const h = p.height * depthScale
      const rx = w * (p.rxFactor || 0.5)
      return (
        <rect
          x={(-w / 2).toFixed(1)}
          y={(-h / 2).toFixed(1)}
          width={w.toFixed(1)}
          height={h.toFixed(1)}
          rx={rx.toFixed(1)}
          fill={eyeColor}
        />
      )
    }
    case 'sparkle': {
      // 灵动双高光瞳：宽高椭圆底胚 + 两个微小白色高光斑
      const p = params.sparkle ?? DEFAULT_EYE_PARAMS.sparkle
      const w = p.width * depthScale * widthShrink
      const h = p.height * depthScale
      const rx = w / 2
      const hlR1 = 2.4 * depthScale * p.hlScale
      const hlR2 = 1.3 * depthScale * p.hlScale
      return (
        <>
          <rect
            x={(-w / 2).toFixed(1)}
            y={(-h / 2).toFixed(1)}
            width={w.toFixed(1)}
            height={h.toFixed(1)}
            rx={rx.toFixed(1)}
            fill={eyeColor}
          />
          <circle
            cx={(-w * 0.22).toFixed(1)}
            cy={(-h * 0.22).toFixed(1)}
            r={hlR1.toFixed(1)}
            fill={bodyColor}
            opacity="0.95"
          />
          <circle
            cx={(w * 0.24).toFixed(1)}
            cy={(h * 0.22).toFixed(1)}
            r={hlR2.toFixed(1)}
            fill={bodyColor}
            opacity="0.8"
          />
        </>
      )
    }
    case 'cat': {
      // 猫咪梭形眼：半宽、半高、弧线尖锐系数
      const p = params.cat ?? DEFAULT_EYE_PARAMS.cat
      const rx = (p.width * depthScale * widthShrink).toFixed(1)
      const ry = (p.height * depthScale).toFixed(1)
      const curve = p.sharpness
      const rxNum = Number.parseFloat(rx)
      const ryNum = Number.parseFloat(ry)
      return (
        <path
          d={`M 0 ${-ryNum} C ${rxNum} ${(-ryNum * curve).toFixed(1)}, ${rxNum} ${(ryNum * curve).toFixed(1)}, 0 ${ryNum} C ${-rxNum} ${(ryNum * curve).toFixed(1)}, ${-rxNum} ${(-ryNum * curve).toFixed(1)}, 0 ${-ryNum} Z`}
          fill={eyeColor}
        />
      )
    }
    case 'cyber-bar': {
      // 数码横条眼：宽度与厚度
      const p = params['cyber-bar'] ?? DEFAULT_EYE_PARAMS['cyber-bar']
      const w = p.width * depthScale * widthShrink
      const h = p.height * depthScale
      const r = Math.min(h / 2, p.radius * depthScale)
      return (
        <rect
          x={(-w / 2).toFixed(1)}
          y={(-h / 2).toFixed(1)}
          width={w.toFixed(1)}
          height={h.toFixed(1)}
          rx={r.toFixed(1)}
          fill={eyeColor}
        />
      )
    }
    case 'squircle': {
      // 像素方圆眼：边长与倒角
      const p = params.squircle ?? DEFAULT_EYE_PARAMS.squircle
      const size = p.size * depthScale
      const w = size * widthShrink
      const r = p.radius * depthScale
      return (
        <rect
          x={(-w / 2).toFixed(1)}
          y={(-size / 2).toFixed(1)}
          width={w.toFixed(1)}
          height={size.toFixed(1)}
          rx={r.toFixed(1)}
          fill={eyeColor}
        />
      )
    }
    default: {
      const w = 15.0 * depthScale * widthShrink
      const h = 19.0 * depthScale
      return (
        <rect
          x={(-w / 2).toFixed(1)}
          y={(-h / 2).toFixed(1)}
          width={w.toFixed(1)}
          height={h.toFixed(1)}
          rx={(w / 2).toFixed(1)}
          fill={eyeColor}
        />
      )
    }
  }
}

/**
 * 核心组合渲染引擎：表情动作叠加在基础眼型之上
 */
export function renderEyeJSX(
  shape: PetEyeShape,
  emotion: PetEmotion,
  side: 'left' | 'right',
  x: number,
  y: number,
  dynamicTilt: number,
  depthScale: number,
  widthShrink: number,
  blinkScaleY: number,
  eyeColor: string,
  blushColor: string,
  params: PetEyeParamsMap = DEFAULT_EYE_PARAMS,
  bodyColor = 'var(--pet-body-color)'
): React.ReactNode {
  // 1. 覆盖型表情：特定符号路径替换基础眼球
  if (emotion === 'happy') {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${dynamicTilt.toFixed(1)}) scale(${depthScale.toFixed(2)}, ${depthScale.toFixed(2)})`}
      >
        <path
          d="M -9 4 Q 0 -6 9 4"
          stroke={eyeColor}
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    )
  }

  if (emotion === 'sleep') {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${depthScale.toFixed(2)}, ${depthScale.toFixed(2)})`}
      >
        <line
          x1="-9"
          y1="0"
          x2="9"
          y2="0"
          stroke={eyeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    )
  }

  if (emotion === 'love') {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${dynamicTilt.toFixed(1)}) scale(${(depthScale * 0.95).toFixed(2)}, ${(depthScale * 0.95 * blinkScaleY).toFixed(2)})`}
      >
        <path
          d="M 0 6 C -8 1, -12 -5, -6 -9 C -2 -11, 0 -8, 0 -6 C 0 -8, 2 -11, 6 -9 C 12 -5, 8 1, 0 6 Z"
          fill={blushColor}
        />
      </g>
    )
  }

  if (emotion === 'dizzy') {
    const animName = side === 'left' ? 'spinDizzyCw' : 'spinDizzyCcw'
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${dynamicTilt.toFixed(1)}) scale(${depthScale.toFixed(2)}, ${depthScale.toFixed(2)})`}
      >
        <g
          style={{
            animation: 'pulseWoozy 1.4s ease-in-out infinite',
            transformOrigin: '0 0'
          }}
        >
          <g
            style={{
              animation: `${animName} 1.2s linear infinite`,
              transformOrigin: '0 0'
            }}
          >
            <path
              d="M 0 0 C 1 -1, 2.5 -1, 3 0 C 3.5 1.5, 2.5 3.5, 0 3.5 C -3.5 3.5, -5.5 1, -5.5 -2 C -5.5 -5.5, -2 -8, 2 -8 C 6.5 -8, 10 -4.5, 10 1 C 10 7, 5 12, -1.5 12 C -8.5 12, -14 6.5, -14 -1 C -14 -9, -8 -15.5, 0.5 -15.5"
              fill="none"
              stroke={eyeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="0" cy="0" r="1.8" fill={eyeColor} />
          </g>
        </g>
      </g>
    )
  }

  if (emotion === 'eyeroll') {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${depthScale.toFixed(2)}, ${depthScale.toFixed(2)})`}
      >
        <circle
          cx="0"
          cy="0"
          r="10.5"
          stroke={eyeColor}
          strokeWidth="2.2"
          fill="none"
          opacity="0.4"
        />
        <circle cx="0" cy="-4.2" r="5.5" fill={eyeColor} />
      </g>
    )
  }

  if (emotion === 'wink' && side === 'left') {
    return (
      <g
        transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${(dynamicTilt * 0.4).toFixed(1)}) scale(${depthScale.toFixed(2)}, ${depthScale.toFixed(2)})`}
      >
        <path
          d="M -9 1 Q 0 -5 9 1"
          stroke={eyeColor}
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    )
  }

  // 2. 叠加型表情：保留当前所选眼型，叠加姿态倾角与眨眼缩放
  let emotionTilt = 0
  if (emotion === 'sad') {
    emotionTilt = side === 'left' ? 22 : -22
  } else if (emotion === 'angry') {
    emotionTilt = side === 'left' ? -22 : 22
  }

  const totalTilt = dynamicTilt + emotionTilt
  const eyeGeometry = getBaseEyeGeometry(
    shape,
    depthScale,
    widthShrink,
    params,
    eyeColor,
    bodyColor
  )

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${totalTilt.toFixed(1)}) scale(1, ${blinkScaleY.toFixed(2)})`}
    >
      {eyeGeometry}
    </g>
  )
}

export function PetEyeSystem({ runtime, hasBaymaxBridge = false }: PetEyeSystemProps) {
  const {
    currentEyeShape,
    currentEyeParams,
    currentEmotion,
    eyeLx,
    eyeLy,
    eyeRx,
    eyeRy,
    dynamicTilt,
    depthScaleL,
    depthScaleR,
    widthShrinkL,
    widthShrinkR,
    blinkScaleY,
    eyeColor,
    blushColor,
    bodyColor
  } = runtime

  return (
    <g className="eye-system">
      {/* 动画全局样式注入 */}
      <style>{`
        @keyframes pulseWoozy {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes spinDizzyCw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinDizzyCcw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>

      {/* 大白特征眼桥 */}
      {hasBaymaxBridge && (
        <line
          x1={eyeLx.toFixed(1)}
          y1={eyeLy.toFixed(1)}
          x2={eyeRx.toFixed(1)}
          y2={eyeRy.toFixed(1)}
          stroke={eyeColor}
          strokeWidth={(2.6 * ((depthScaleL + depthScaleR) / 2)).toFixed(1)}
          strokeLinecap="round"
          style={{
            opacity: currentEmotion === 'sleep' ? 0.15 : 0.85,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* 左眼 */}
      <g className="eye left-eye">
        {renderEyeJSX(
          currentEyeShape,
          currentEmotion,
          'left',
          eyeLx,
          eyeLy,
          dynamicTilt,
          depthScaleL,
          widthShrinkL,
          blinkScaleY,
          eyeColor,
          blushColor,
          currentEyeParams,
          bodyColor
        )}
      </g>

      {/* 右眼 */}
      <g className="eye right-eye">
        {renderEyeJSX(
          currentEyeShape,
          currentEmotion,
          'right',
          eyeRx,
          eyeRy,
          dynamicTilt,
          depthScaleR,
          widthShrinkR,
          blinkScaleY,
          eyeColor,
          blushColor,
          currentEyeParams,
          bodyColor
        )}
      </g>
    </g>
  )
}
