import { useRouterState } from '@tanstack/react-router'
import { cn, Progress } from '@zen/ui'
import { useReducedMotion } from 'motion/react'

import { APP_BRAND_NAME, APP_BRAND_TAGLINE } from '@/config/brand'
import { BOOT_STATUS } from '@/lib/boot-splash'

const ICON_SIZE = {
  fullscreen: 44,
  overlay: 24,
  inline: 18
} as const

const RAIL_OPACITY = {
  fullscreen: 0.14,
  overlay: 0.22
} as const

export type LoadingStateVariant = 'fullscreen' | 'overlay' | 'inline'

export interface LoadingStateProps {
  /** fullscreen 首屏，overlay 覆盖所在容器，inline 仅显示标记 */
  variant?: LoadingStateVariant
  /** 自定义状态文案 */
  label?: string
  className?: string
}

interface LoadingFrameProps {
  label?: string
  className?: string
}

/**
 * 异步加载提示。
 * 路由 `pendingComponent` 使用 overlay；路由 pending 的全屏态用 `BootLoading`。
 * 脚本执行前的冷启动由 `index.html` 的 `#boot-splash` 覆盖，首次路由就绪后移除。
 */
export function LoadingState({ variant = 'overlay', label, className }: LoadingStateProps = {}) {
  if (variant === 'inline') {
    return <PendingMark variant="inline" className={className} />
  }

  if (variant === 'fullscreen') {
    return <FullscreenLoading label={label} className={className} />
  }

  return <OverlayLoading label={label} className={className} />
}

/** 根路由与认证闸门的首屏加载。 */
export function BootLoading() {
  return <LoadingState variant="fullscreen" />
}

function FullscreenLoading({ label, className }: LoadingFrameProps) {
  const status = label ?? BOOT_STATUS.enter

  return (
    <div
      className={cn(
        'boot-screen fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="boot-mark">
        <PendingMark variant="fullscreen" />
      </div>
      <p className="boot-brand">
        <span>{APP_BRAND_NAME}</span>
        <span className="boot-tagline">{APP_BRAND_TAGLINE}</span>
      </p>
      <p className="boot-status">{status}</p>
      <Progress value={null} aria-label={status} className="mt-8 w-48" />
    </div>
  )
}

function OverlayLoading({ label, className }: LoadingFrameProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div
      className={cn(
        'relative flex h-full min-h-72 w-full flex-1 items-center justify-center bg-background/80 text-foreground supports-backdrop-filter:backdrop-blur-xs',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3 text-foreground shadow-lg">
        <PendingMark variant="overlay" />
        <div className="min-w-0">
          <p className="text-sm leading-5">{label ?? '正在加载…'}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{pathname}</p>
        </div>
      </div>
    </div>
  )
}

function PendingMark({ variant, className }: { variant: LoadingStateVariant; className?: string }) {
  const reduceMotion = useReducedMotion() === true
  const fullscreen = variant === 'fullscreen'
  const duration = fullscreen ? '2s' : '0.95s'
  // dasharray 必须是静态属性。写进 @keyframes 后 Chromium 不会重复描边。
  const beamDash = fullscreen ? '100 100' : '38 62'
  const beam = fullscreen
    ? `zen-genesis-beam ${duration} cubic-bezier(0.65, 0, 0.35, 1) infinite`
    : `zen-route-pulse ${duration} cubic-bezier(0.4, 0, 0.2, 1) infinite`

  return (
    <svg
      viewBox="0 0 24 24"
      width={ICON_SIZE[variant]}
      height={ICON_SIZE[variant]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <style>
        {`
          @keyframes zen-genesis-beam {
            0% { stroke-dashoffset: 100; }
            45%, 58% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -100; }
          }
          @keyframes zen-route-pulse {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: -100; }
          }
          @keyframes zen-core-breathe {
            0%, 100% { opacity: 0.06; transform: scale(0.95); }
            50% { opacity: 0.18; transform: scale(1); }
          }
        `}
      </style>
      <path
        d="M1.6 15.2V5.6C1.6 3.39086 3.39086 1.6 5.6 1.6H19.6L4.4 16.8"
        stroke="currentColor"
        strokeOpacity={fullscreen ? RAIL_OPACITY.fullscreen : RAIL_OPACITY.overlay}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.4 8.8V18.4C22.4 20.6091 20.6091 22.4 18.4 22.4H4.4L19.6 7.2"
        stroke="currentColor"
        strokeOpacity={fullscreen ? RAIL_OPACITY.fullscreen : RAIL_OPACITY.overlay}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 6.2C1 3.328 3.328 1 6.2 1H18.8L6.2 13.6H17.8C20.672 13.6 23 15.928 23 18.8C23 21.672 20.672 23 17.8 23H5.2L17.8 10.4H6.2C3.328 10.4 1 8.52 1 6.2Z"
        fill="currentColor"
        style={{
          transformOrigin: '12px 12px',
          opacity: reduceMotion ? 0.12 : undefined,
          animation: reduceMotion ? undefined : `zen-core-breathe ${duration} ease-in-out infinite`
        }}
      />
      <path
        pathLength="100"
        d="M1.6 15.2V5.6C1.6 3.39086 3.39086 1.6 5.6 1.6H19.6L4.4 16.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={reduceMotion ? undefined : beamDash}
        strokeDashoffset={reduceMotion ? undefined : 100}
        style={{ animation: reduceMotion ? undefined : beam }}
      />
      <path
        pathLength="100"
        d="M22.4 8.8V18.4C22.4 20.6091 20.6091 22.4 18.4 22.4H4.4L19.6 7.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={reduceMotion ? undefined : beamDash}
        strokeDashoffset={reduceMotion ? undefined : 100}
        style={{ animation: reduceMotion ? undefined : beam }}
      />
    </svg>
  )
}
