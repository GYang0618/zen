import { Card, CardContent, CardHeader, CardTitle, cn } from '@zen/ui'
import { useMemo } from 'react'

import { OverflowText } from './overflow-text'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export type GanttTaskStatus = 'done' | 'in_progress' | 'todo'

export interface GanttTaskItem {
  id?: string
  title: string
  status?: GanttTaskStatus | string
  statusLabel?: string
  points?: string | number
  start: string | number
  end: string | number
  color?: string
}

export interface GanttMetric {
  label: string
  value: string
  progress: number
}

export interface GanttChartProps {
  title?: string
  subtitle?: string
  metrics?: GanttMetric[]
  dates: string[]
  today?: string
  tasks: GanttTaskItem[]
  footer?: string
  className?: string
}

const DEFAULT_METRICS: GanttMetric[] = [
  { label: '容量', value: '已承诺 36 / 40 点', progress: 90 },
  { label: '完成度', value: '已完成 8 点（22%）', progress: 22 },
  { label: '进行中', value: '19 点进行中', progress: 52 }
]

const DEFAULT_DATES = ['9', '10', '11', '12', '13', '16', '17', '18', '19', '20']

const STATUS_BAR_COLORS: Record<GanttTaskStatus, string> = {
  done: 'bg-muted-foreground/50 dark:bg-muted-foreground/50',
  in_progress: 'bg-muted-foreground/80 dark:bg-muted-foreground/85',
  todo: 'bg-muted-foreground/25 dark:bg-muted-foreground/30'
}

const STATUS_LABEL_MAP: Record<GanttTaskStatus, string> = {
  done: '已完成',
  in_progress: '进行中',
  todo: '待办'
}

export function GanttChart({ props }: RendererProps<GanttChartProps>) {
  const {
    title,
    subtitle,
    metrics = DEFAULT_METRICS,
    dates = DEFAULT_DATES,
    today = '13',
    tasks = [],
    footer,
    className
  } = props

  const numCols = Math.max(dates.length, 1)

  // 计算 Today 线在网格中的横向百分比位置
  const todayIndex = useMemo(() => {
    return dates.findIndex((d) => String(d) === String(today))
  }, [dates, today])

  const todayLineLeftPct = useMemo(() => {
    if (todayIndex === -1) return null
    // 居中穿过该列中心
    return ((todayIndex + 0.5) / numCols) * 100
  }, [todayIndex, numCols])

  return (
    <Card
      className={cn(
        '@container/chart h-full w-full [--gantt-label:12rem] @sm/chart:[--gantt-label:14rem]',
        className
      )}
    >
      {(title || subtitle) && (
        <CardHeader className="space-y-1 pb-3">
          {title && (
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          )}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardHeader>
      )}

      <CardContent className="space-y-5 pt-3">
        {/* 顶部三段式进度汇总卡 (Capacity / Completion / In progress) */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-muted/10 p-3.5 @sm/chart:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <span className="block text-xs font-medium text-muted-foreground">{m.label}</span>
                <span className="block font-mono text-xs font-semibold text-foreground @sm/chart:text-sm">
                  {m.value}
                </span>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60"
                  role="progressbar"
                  aria-label={m.label}
                  aria-valuenow={m.progress}
                >
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 甘特排期主表格容器 */}
        <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
          <div className="min-w-[620px]">
            {/* 表头：Task + 日期刻度列 */}
            <div className="flex items-center border-b border-border/40 text-xs">
              <div className="w-(--gantt-label) shrink-0 px-4 py-2.5 font-medium text-muted-foreground">
                Task
              </div>
              <div
                className="grid flex-1 text-center font-mono text-xs"
                style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
              >
                {dates.map((d) => {
                  const isToday = String(d) === String(today)
                  return (
                    <span
                      key={`gantt-date-${d}`}
                      className={cn(
                        'py-2.5 font-medium transition-colors border-l border-border/20 first:border-l-0',
                        isToday ? 'font-bold text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {d}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* 任务行列表 */}
            <div className="relative divide-y divide-border/20">
              {/* 今日基准指示线 (Today Marker Line) */}
              {todayLineLeftPct !== null && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-10 w-px border-r-2 border-foreground/60"
                  style={{
                    left: `calc(var(--gantt-label) + (100% - var(--gantt-label)) * ${todayLineLeftPct / 100})`
                  }}
                  aria-hidden
                />
              )}

              {tasks.map((task, tIdx) => {
                const normalizedStatus = (task.status || 'todo') as GanttTaskStatus
                const statusLabel =
                  task.statusLabel || STATUS_LABEL_MAP[normalizedStatus] || task.status || '待办'
                const pointsLabel =
                  task.points !== undefined
                    ? typeof task.points === 'number'
                      ? `${task.points} 点`
                      : task.points
                    : null

                // 计算当前任务在 dates 中的索引区间（兼顾 start/startDate 与 end/endDate）
                const rawStart =
                  task.start ??
                  (task as unknown as { startDate?: string | number }).startDate ??
                  dates[0]
                const rawEnd =
                  task.end ?? (task as unknown as { endDate?: string | number }).endDate ?? rawStart

                const startIdx = dates.findIndex((d) => String(d) === String(rawStart))
                const endIdx = dates.findIndex((d) => String(d) === String(rawEnd))

                const validStart = startIdx !== -1 ? startIdx : 0
                const validEnd = endIdx !== -1 ? endIdx : validStart

                const leftPct = (validStart / numCols) * 100
                const spanDays = Math.max(1, validEnd - validStart + 1)
                const widthPct = (spanDays / numCols) * 100

                const barColor =
                  task.color || STATUS_BAR_COLORS[normalizedStatus] || STATUS_BAR_COLORS.todo

                return (
                  <div
                    key={task.id || `${task.title}-${tIdx}`}
                    className="flex items-center text-xs transition-colors hover:bg-muted/10"
                  >
                    {/* 左侧任务名称与状态/点数徽章 */}
                    <div className="w-(--gantt-label) shrink-0 space-y-1 px-4 py-3">
                      <OverflowText className="font-medium text-foreground">
                        {task.title}
                      </OverflowText>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-sm border border-border/40 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          {statusLabel}
                        </span>
                        {pointsLabel && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {pointsLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 右侧排期横条网格轨道 */}
                    <div className="relative flex-1 py-3 px-1">
                      {/* 网格背景竖虚线 */}
                      <div
                        className="pointer-events-none absolute inset-0 grid"
                        style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
                        aria-hidden
                      >
                        {dates.map((_, colIdx) => (
                          <div
                            key={`grid-line-${colIdx}`}
                            className="border-l border-border/15 first:border-l-0"
                          />
                        ))}
                      </div>

                      {/* 甘特横条 (Gantt Bar) */}
                      <div className="relative h-4 w-full">
                        <div
                          role="img"
                          aria-label={`${task.title}: ${task.start} - ${task.end} (${statusLabel})`}
                          className={cn(
                            'absolute top-0 bottom-0 rounded-full transition-all duration-300 shadow-xs hover:brightness-110',
                            barColor
                          )}
                          style={{
                            left: `${leftPct}%`,
                            width: `calc(${widthPct}% - 8px)`
                          }}
                          title={`${task.title} (${task.start} - ${task.end}): ${statusLabel}`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 底部补充说明 */}
        {footer && <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{footer}</p>}
      </CardContent>
    </Card>
  )
}
