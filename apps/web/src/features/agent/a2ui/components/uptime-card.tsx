import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@zen/ui'

import { OverflowText } from './overflow-text'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export type UptimeStatus = 'operational' | 'degraded' | 'outage'

export interface UptimeDayEntry {
  status: UptimeStatus
  date?: string
  note?: string
}

export interface UptimeServiceItem {
  service: string
  uptime?: string
  days: Array<UptimeStatus | UptimeDayEntry>
}

export interface UptimeCardProps {
  title: string
  subtitle?: string
  dateLabels?: string[]
  services: UptimeServiceItem[]
  legend?: {
    operationalLabel?: string
    degradedLabel?: string
    outageLabel?: string
  }
  footer?: string
  className?: string
}

const STATUS_CLASSES: Record<UptimeStatus, string> = {
  operational: 'bg-muted-foreground/25 dark:bg-muted-foreground/30 hover:opacity-80',
  degraded: 'bg-muted-foreground/75 dark:bg-muted-foreground/75 hover:opacity-90',
  outage: 'bg-foreground dark:bg-foreground hover:opacity-90'
}

const DEFAULT_DAYS = [
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12'
]

export function UptimeCard({ props }: RendererProps<UptimeCardProps>) {
  const {
    title,
    subtitle,
    dateLabels = DEFAULT_DAYS,
    services = [],
    legend,
    footer,
    className
  } = props

  const operationalLabel = legend?.operationalLabel ?? '正常'
  const degradedLabel = legend?.degradedLabel ?? '降级'
  const outageLabel = legend?.outageLabel ?? '故障'

  const numDays = Math.max(dateLabels.length, 1)

  return (
    <TooltipProvider delay={100}>
      <Card className={cn('@container/chart h-full w-full', className)}>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          {/* 右上角状态图例 */}
          <div className="flex items-center gap-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/25 shrink-0" />
              <span>{operationalLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/75 shrink-0" />
              <span>{degradedLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-foreground shrink-0" />
              <span>{outageLabel}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-1">
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[620px] space-y-2.5">
              {/* 表头列：Service + 日期刻度数字 + Uptime */}
              <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground border-b border-border/40 pb-2">
                <div className="w-24 shrink-0 @sm/chart:w-28">服务</div>
                <div
                  className="grid flex-1 gap-1 text-center font-mono text-[11px]"
                  style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}
                >
                  {dateLabels.map((lbl, idx) => (
                    <span key={`date-${lbl}-${idx}`}>{lbl}</span>
                  ))}
                </div>
                <div className="w-16 shrink-0 text-right">可用率</div>
              </div>

              {/* 服务状态行列表 */}
              <div className="space-y-3">
                {services.map((item, sIdx) => {
                  const serviceName =
                    item.service ||
                    (item as unknown as { name?: string }).name ||
                    `服务 ${sIdx + 1}`
                  const rawDays =
                    item.days || (item as unknown as { statuses?: unknown[] }).statuses
                  const daysList = Array.isArray(rawDays) ? rawDays : []

                  return (
                    <div key={`${serviceName}-${sIdx}`} className="flex items-center gap-3 text-xs">
                      {/* 服务名称 */}
                      <div className="w-24 shrink-0 @sm/chart:w-28">
                        <OverflowText className="font-medium text-foreground">
                          {serviceName}
                        </OverflowText>
                      </div>

                      {/* 30 天状态药丸块 */}
                      <div
                        className="grid flex-1 gap-1"
                        style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}
                      >
                        {daysList.map((dayEntry, dIdx) => {
                          const status: UptimeStatus =
                            typeof dayEntry === 'string' ? dayEntry : dayEntry.status
                          const dateLabel =
                            typeof dayEntry === 'object' && dayEntry.date
                              ? dayEntry.date
                              : dateLabels[dIdx] || `第 ${dIdx + 1} 天`
                          const note =
                            typeof dayEntry === 'object' && dayEntry.note ? dayEntry.note : null

                          const statusText =
                            status === 'operational'
                              ? operationalLabel
                              : status === 'degraded'
                                ? degradedLabel
                                : outageLabel

                          const pillNode = (
                            <div
                              tabIndex={0}
                              role="button"
                              aria-label={`${item.service} ${dateLabel}: ${statusText}`}
                              className={cn(
                                'h-6 w-full rounded-[4px] transition-transform hover:scale-110 focus-visible:outline-hidden',
                                STATUS_CLASSES[status]
                              )}
                            />
                          )

                          return (
                            <Tooltip key={`pill-${item.service}-${dIdx}`}>
                              <TooltipTrigger render={pillNode} />
                              <TooltipContent
                                side="top"
                                className="rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md font-mono"
                              >
                                <div className="font-semibold">
                                  {item.service} · {dateLabel}
                                </div>
                                <div className="text-[10px] text-background/80">
                                  {note ?? statusText}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>

                      {/* 可用率百分比 */}
                      <div className="w-16 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-foreground/90">
                        {item.uptime || '100.00%'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 底部备注说明 */}
          {footer && (
            <p className="border-t border-border/40 pt-2.5 text-xs text-muted-foreground leading-relaxed">
              {footer}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
