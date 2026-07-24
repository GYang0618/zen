import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@zen/ui'
import { MapPin, Play, Square, Trash2, X } from 'lucide-react'

import { useWalkthroughStore, WALKTHROUGH_MIN_WAYPOINTS } from '../../stores/walkthrough'

import type { WalkthroughPoint } from '../../stores/walkthrough'

function formatPoint(point: WalkthroughPoint): string {
  return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`
}

export function WaypointCollectPanel() {
  const phase = useWalkthroughStore((state) => state.phase)
  const waypoints = useWalkthroughStore((state) => state.waypoints)
  const startPicking = useWalkthroughStore((state) => state.startPicking)
  const removeWaypoint = useWalkthroughStore((state) => state.removeWaypoint)
  const completePicking = useWalkthroughStore((state) => state.completePicking)
  const cancelCollection = useWalkthroughStore((state) => state.cancelCollection)

  const isPicking = phase === 'picking'
  const canComplete = waypoints.length >= WALKTHROUGH_MIN_WAYPOINTS

  return (
    <Card className="w-full max-w-sm border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">室内漫游 · 点位拾取</CardTitle>
          <Badge variant={isPicking ? 'default' : 'secondary'}>
            {isPicking ? '拾取中' : '待开始'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          点击「开始」后在场景中点选地面路径（拾取时会暂时隐藏空间体）；至少{' '}
          {WALKTHROUGH_MIN_WAYPOINTS} 个点位后可完成并开始漫游。
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
          {waypoints.length === 0 ? (
            <li className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              尚未拾取点位
            </li>
          ) : (
            waypoints.map((point, index) => (
              <li
                key={`${point.x}-${point.y}-${point.z}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5"
              >
                <span className="truncate font-mono text-xs">
                  {index + 1}. {formatPoint(point)}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`删除第 ${index + 1} 个点位`}
                  onClick={() => removeWaypoint(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))
          )}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isPicking}
            onClick={startPicking}
            className="gap-1.5"
          >
            <Play className="size-3.5" aria-hidden />
            {isPicking ? '拾取已激活' : '开始'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canComplete}
            onClick={completePicking}
            className="gap-1.5"
          >
            <Square className="size-3.5" aria-hidden />
            完成并漫游
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={cancelCollection}
            className="gap-1.5"
          >
            <X className="size-3.5" aria-hidden />
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
