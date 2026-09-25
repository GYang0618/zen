import { motion, useReducedMotion } from 'motion/react'

const OUTER_ORBIT_SECONDS = 2.6
const INNER_ORBIT_SECONDS = 1.8
const CORE_PULSE_SECONDS = 1.6
const DOT_PULSE_SECONDS = 1.2
const DOT_STAGGER_SECONDS = 0.2

const LINEAR_SPIN = { duration: OUTER_ORBIT_SECONDS, repeat: Infinity, ease: 'linear' as const }

/** 路由切换与懒加载时的居中等待态。 */
export function RoutePending() {
  const reduceMotion = useReducedMotion() === true

  return (
    <div
      className="grid min-h-svh w-full flex-1 place-items-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5">
        <PendingMark paused={reduceMotion} />
        <PendingCaption paused={reduceMotion} />
      </div>
    </div>
  )
}

function PendingMark({ paused }: { paused: boolean }) {
  return (
    <div className="relative size-16" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="40" cy="40" r="30" fill="none" className="stroke-border" strokeWidth="1" />
      </svg>

      <motion.div
        className="absolute inset-0"
        animate={paused ? undefined : { rotate: 360 }}
        transition={paused ? undefined : LINEAR_SPIN}
      >
        <svg viewBox="0 0 80 80" className="size-full text-primary" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="28 72"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={paused ? undefined : { rotate: -360 }}
        transition={
          paused
            ? undefined
            : { duration: INNER_ORBIT_SECONDS, repeat: Infinity, ease: 'linear' }
        }
      >
        <svg viewBox="0 0 80 80" className="size-full text-primary/55" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="16 84"
          />
        </svg>
      </motion.div>

      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.span
          className="block size-1.5 rounded-full bg-primary"
          animate={paused ? undefined : { scale: [1, 0.45, 1], opacity: [1, 0.4, 1] }}
          transition={
            paused
              ? undefined
              : { duration: CORE_PULSE_SECONDS, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </span>
    </div>
  )
}

function PendingCaption({ paused }: { paused: boolean }) {
  return (
    <p className="text-sm text-muted-foreground">
      正在加载
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            animate={paused ? { opacity: 1 } : { opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: DOT_PULSE_SECONDS,
              repeat: paused ? 0 : Infinity,
              delay: index * DOT_STAGGER_SECONDS,
              ease: 'easeInOut'
            }}
          >
            .
          </motion.span>
        ))}
      </span>
    </p>
  )
}
