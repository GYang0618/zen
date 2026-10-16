const DOCK_BUTTON_CLASS =
  'relative h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-all duration-200'

const DOCK_BUTTON_ACTIVE_CLASS =
  'bg-primary/20 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_12px_rgba(var(--primary),0.35)] ring-1 ring-primary/40'

const DOCK_BUTTON_IDLE_CLASS = 'text-foreground/80 hover:bg-white/25 dark:hover:bg-white/10'

export function dockButtonClass(active: boolean): string {
  return `${DOCK_BUTTON_CLASS} ${active ? DOCK_BUTTON_ACTIVE_CLASS : DOCK_BUTTON_IDLE_CLASS}`
}
