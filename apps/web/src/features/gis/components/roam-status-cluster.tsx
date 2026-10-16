import { Button } from '@zen/ui'
import { Compass, Eye, Footprints, Plane, Timer, Video } from 'lucide-react'

import { formatDistance, formatEstimatedArrivalTime } from '../lib/geo-utils'
import { isAirVehicle } from '../lib/roam/model'
import { useGisRoamStore } from '../stores/gis-roam'
import { ROAM_FLIGHT_PHASE_LABEL, ROAM_STATUS_LABEL, ROAM_VIEW_MODE_LABEL } from './roam-labels'

export function RoamStatusCluster() {
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const viewMode = useGisRoamStore((state) => state.viewMode)
  const totalDistanceMeters = useGisRoamStore((state) => state.totalDistanceMeters)
  const remainingRealSeconds = useGisRoamStore((state) => state.remainingRealSeconds)
  const flightPhase = useGisRoamStore((state) => state.flightPhase)
  const toggleViewMode = useGisRoamStore((state) => state.toggleViewMode)
  const viewTarget = useGisRoamStore((state) => state.viewTarget)
  const setViewTarget = useGisRoamStore((state) => state.setViewTarget)
  const airdropInfo = useGisRoamStore((state) => state.airdropInfo)
  const air = isAirVehicle(vehicleType)
  const StatusIcon = air ? Plane : Footprints
  const ViewIcon = viewMode === 'first_person' ? Eye : viewMode === 'third_person' ? Video : Compass

  return (
    <>
      <StatusIcon className="size-3.5 shrink-0 animate-pulse" />
      <span className="shrink-0 whitespace-nowrap font-medium text-[11px]">
        {ROAM_STATUS_LABEL[vehicleType]}
      </span>
      {totalDistanceMeters > 0 ? (
        <span className="shrink-0 whitespace-nowrap font-mono text-[10px] opacity-80">
          ({formatDistance(totalDistanceMeters)})
        </span>
      ) : null}
      {typeof remainingRealSeconds === 'number' ? (
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-primary/30">
          <Timer className="size-3 shrink-0 animate-pulse text-primary" />
          <span className="shrink-0 whitespace-nowrap">
            预计{formatEstimatedArrivalTime(remainingRealSeconds)}
          </span>
        </div>
      ) : null}
      <div className="ml-1 flex shrink-0 items-center border-l border-primary/25 pl-1.5 whitespace-nowrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleViewMode}
          className="h-6 shrink-0 rounded-full px-2 text-[10px] font-medium text-primary whitespace-nowrap hover:bg-primary/20"
        >
          <ViewIcon className="mr-1 size-3 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">{ROAM_VIEW_MODE_LABEL[viewMode]}</span>
        </Button>
      </div>
      {air && flightPhase ? (
        <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/25 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
          {ROAM_FLIGHT_PHASE_LABEL[flightPhase]}
        </span>
      ) : null}
      {airdropInfo?.isDescending ? (
        <AirdropFollowButton
          tracking={viewTarget === 'airdrop'}
          altitudeMeters={airdropInfo.altitudeMeters}
          groundHeight={airdropInfo.groundHeight}
          onToggle={() => setViewTarget(viewTarget === 'airdrop' ? 'vehicle' : 'airdrop')}
        />
      ) : null}
    </>
  )
}

function AirdropFollowButton({
  tracking,
  altitudeMeters,
  groundHeight,
  onToggle
}: {
  tracking: boolean
  altitudeMeters: number
  groundHeight: number
  onToggle: () => void
}) {
  const clearance = Math.max(0, Math.round(altitudeMeters - groundHeight))
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`h-6 shrink-0 rounded-full border px-2 text-[10px] font-medium whitespace-nowrap transition-all ${
        tracking
          ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:bg-amber-500/30'
          : 'animate-pulse border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
      }`}
    >
      {tracking ? (
        <>
          <Plane className="mr-1 size-3 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">返回飞机 (距地 {clearance} m)</span>
        </>
      ) : (
        <>
          <span className="mr-1 shrink-0 text-xs">🪂</span>
          <span className="shrink-0 whitespace-nowrap">跟踪空投 (距地 {clearance} m)</span>
        </>
      )}
    </Button>
  )
}
