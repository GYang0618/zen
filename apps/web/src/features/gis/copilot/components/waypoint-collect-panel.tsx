import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@zen/ui'
import { Footprints, MapPin, Navigation, Plane, Play, Square, Trash2, X } from 'lucide-react'

import { GIS_ROAM_MIN_WAYPOINTS } from '../../constants'
import {
  calculateTotalPathDistance,
  formatCoordinates,
  formatDistance,
  resolveVehicleByDistance
} from '../../lib/geo-utils'
import { useGisRoamStore } from '../../stores/gis-roam'

import type { GisWaypoint } from '../../stores/gis-roam'

export function WaypointCollectPanel() {
  const phase = useGisRoamStore((state) => state.phase)
  const waypoints = useGisRoamStore((state) => state.waypoints)
  const startPicking = useGisRoamStore((state) => state.startPicking)
  const removeWaypoint = useGisRoamStore((state) => state.removeWaypoint)
  const completePicking = useGisRoamStore((state) => state.completePicking)
  const cancelCollection = useGisRoamStore((state) => state.cancelCollection)

  const isPicking = phase === 'picking'
  const canComplete = waypoints.length >= GIS_ROAM_MIN_WAYPOINTS
  const totalDistance = calculateTotalPathDistance(waypoints)
  const inferredVehicle = resolveVehicleByDistance(totalDistance)

  return (
    <Card className="w-full max-w-sm border-border/80 bg-card/95 shadow-sm backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Navigation className="size-4 text-primary" />
            <span>三维漫游 · 点位拾取</span>
          </CardTitle>
          <Badge variant={isPicking ? 'default' : 'secondary'}>
            {isPicking ? '拾取中' : '待开始'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          点击「开始拾取」后在三维地图上连续点选路径（至少 {GIS_ROAM_MIN_WAYPOINTS}{' '}
          个点位）；系统将根据总航程自动匹配步行、车辆或飞机漫游。
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* 航程预估信息 */}
        {waypoints.length >= 2 && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs">
            <span className="text-muted-foreground">预计航程：</span>
            <span className="font-semibold text-foreground">{formatDistance(totalDistance)}</span>
            <div className="flex items-center gap-1 text-primary">
              {inferredVehicle === 'plane' ? (
                <Plane className="size-3.5" />
              ) : (
                <Footprints className="size-3.5" />
              )}
              <span className="font-medium text-[11px]">
                {inferredVehicle === 'walk'
                  ? '步行'
                  : inferredVehicle === 'vehicle'
                    ? '车辆'
                    : '飞机'}
              </span>
            </div>
          </div>
        )}

        {/* 点位列表 */}
        <ul className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
          {waypoints.length === 0 ? (
            <li className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              尚未拾取点位，请点击下方「开始拾取」
            </li>
          ) : (
            waypoints.map((point: GisWaypoint, index: number) => (
              <li
                key={`${point.longitude}-${point.latitude}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5"
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-mono text-xs font-medium">
                    {index + 1}. {point.name || `点位 ${index + 1}`}
                  </span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    {formatCoordinates(point.longitude, point.latitude, point.height)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`删除第 ${index + 1} 个航路点`}
                  onClick={() => removeWaypoint(index)}
                  className="size-6 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              </li>
            ))
          )}
        </ul>

        {/* 按钮操作组 */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={isPicking}
            onClick={startPicking}
            className="gap-1.5 text-xs"
          >
            <Play className="size-3.5" aria-hidden />
            {isPicking ? '拾取已激活' : '开始拾取'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canComplete}
            onClick={completePicking}
            className="gap-1.5 text-xs"
          >
            <Square className="size-3.5" aria-hidden />
            完成并漫游
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={cancelCollection}
            className="gap-1.5 text-xs"
          >
            <X className="size-3.5" aria-hidden />
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
