/**
 * 冷启动阶段文案。
 * `runtime` 必须与 index.html `#boot-splash` 的初始文本一致，脚本执行前靠它显示。
 */
export const BOOT_STATUS = {
  runtime: '正在加载运行环境...',
  session: '正在校验登录状态...',
  enter: '正在进入工作台...'
} as const

const SPLASH_ID = 'boot-splash'
const LINE_CLASS = 'boot-status-line'
const STATUS_MS = 480
const COALESCE_MS = 100

interface BootSplashRouter {
  subscribe(event: 'onBeforeLoad' | 'onLoad' | 'onResolved', listener: () => void): () => void
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readCurrentStatus() {
  return document.querySelector(`#${SPLASH_ID} .${LINE_CLASS}.is-current`)?.textContent ?? ''
}

function playStatus(text: string) {
  const host = document.querySelector(`#${SPLASH_ID} .boot-status`)
  const current = host?.querySelector(`.${LINE_CLASS}.is-current`)
  if (!host || !current) return

  if (prefersReducedMotion()) {
    current.textContent = text
    return
  }

  const next = document.createElement('span')
  next.className = LINE_CLASS
  next.textContent = text
  host.appendChild(next)
  next.getBoundingClientRect()
  current.classList.remove('is-current')
  current.classList.add('is-leaving')
  current.setAttribute('aria-hidden', 'true')
  next.classList.add('is-current')
  window.setTimeout(() => current.remove(), STATUS_MS)
}

/**
 * 按路由阶段更新开屏文案，并在首次就绪后摘掉开屏。
 * 同一时刻的连续阶段会合成一次过渡，避免文案连闪。
 */
export function bindBootSplash(router: BootSplashRouter) {
  let shown = readCurrentStatus()
  let desired = shown
  let coalesce = 0
  let transitionUntil = 0
  const unsubs: Array<() => void> = []

  const flush = () => {
    coalesce = 0
    if (!document.getElementById(SPLASH_ID) || desired === shown) return
    shown = desired
    playStatus(shown)
    transitionUntil = prefersReducedMotion() ? 0 : performance.now() + STATUS_MS
  }

  const queue = (text: string) => {
    if (!document.getElementById(SPLASH_ID)) return
    desired = text
    if (coalesce) return
    coalesce = window.setTimeout(flush, COALESCE_MS)
  }

  const dismiss = () => {
    for (const unsub of unsubs) unsub()
    if (coalesce) {
      window.clearTimeout(coalesce)
      flush()
    }
    const wait = Math.max(0, transitionUntil - performance.now())
    window.setTimeout(() => document.getElementById(SPLASH_ID)?.remove(), wait)
  }

  unsubs.push(
    router.subscribe('onBeforeLoad', () => queue(BOOT_STATUS.session)),
    router.subscribe('onLoad', () => queue(BOOT_STATUS.enter)),
    router.subscribe('onResolved', dismiss)
  )
}
