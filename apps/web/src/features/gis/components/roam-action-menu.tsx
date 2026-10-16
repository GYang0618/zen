import { Button, Popover, PopoverContent, PopoverTrigger } from '@zen/ui'
import { Sparkles } from 'lucide-react'

import { isAirVehicle } from '../lib/roam/model'
import { useGisRoamStore } from '../stores/gis-roam'
import {
  FIGHTER_ALTITUDE_STEPS_METERS,
  FIGHTER_BANK_STEPS_DEG,
  FIGHTER_CLIMB_BOOST_KMH,
  FIGHTER_DIVE_BOOST_KMH,
  PLANE_ALTITUDE_STEPS_METERS,
  PLANE_CLIMB_BOOST_KMH,
  PLANE_DIVE_BOOST_KMH,
  PLANE_TURN_BOOST_KMH,
  PLANE_TURN_STEPS_DEG,
  ROAM_COMMAND_TITLE,
  roamActionLabel,
  WALK_PAUSE_SECONDS
} from './roam-labels'

import type { ReactNode } from 'react'
import type { GisRoamAction } from '../stores/gis-roam'

const COMMAND_BUTTON_CLASS =
  'h-7 justify-start text-xs text-foreground/80 hover:bg-primary/10 hover:text-primary'

export function RoamActionMenu() {
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const activeAction = useGisRoamStore((state) => state.activeAction)
  const triggerAction = useGisRoamStore((state) => state.triggerAction)
  const wide = isAirVehicle(vehicleType)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-1 h-6 shrink-0 rounded-full border border-primary/30 bg-primary/15 px-2 text-[10px] font-medium whitespace-nowrap text-primary hover:bg-primary/25"
          />
        }
      >
        <Sparkles className="mr-1 size-3 shrink-0 animate-spin text-primary" />
        <span className="shrink-0 whitespace-nowrap">
          {activeAction ? roamActionLabel(activeAction) : '实时指令'}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className={`${wide ? 'w-64' : 'w-56'} rounded-2xl border-white/25 bg-background/90 p-2.5 shadow-2xl backdrop-blur-xl dark:border-white/10`}
      >
        <div className="pb-1.5 text-xs font-semibold text-foreground">
          {ROAM_COMMAND_TITLE[vehicleType]}
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          {vehicleType === 'walk' ? <WalkCommands onAction={triggerAction} /> : null}
          {vehicleType === 'vehicle' ? <VehicleCommands onAction={triggerAction} /> : null}
          {vehicleType === 'plane' ? <PlaneCommands onAction={triggerAction} /> : null}
          {vehicleType === 'fighter' ? <FighterCommands onAction={triggerAction} /> : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function WalkCommands({ onAction }: { onAction: (action: GisRoamAction) => void }) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction({ type: 'jump' })}
        className={COMMAND_BUTTON_CLASS}
      >
        🦘 垂直跳跃 (抛物线落地)
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction({ type: 'pause_briefly', durationSeconds: WALK_PAUSE_SECONDS })}
        className={COMMAND_BUTTON_CLASS}
      >
        ⏱️ 原地驻留 {WALK_PAUSE_SECONDS} 秒后继续
      </Button>
    </>
  )
}

function VehicleCommands({ onAction }: { onAction: (action: GisRoamAction) => void }) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction({ type: 'lane_change_left' })}
        className={COMMAND_BUTTON_CLASS}
      >
        🚗⬅️ 向左变道超车并回归
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction({ type: 'lane_change_right' })}
        className={COMMAND_BUTTON_CLASS}
      >
        🚗➡️ 向右变道超车并回归
      </Button>
    </>
  )
}

function PlaneCommands({ onAction }: { onAction: (action: GisRoamAction) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction({ type: 'airdrop' })}
        className={COMMAND_BUTTON_CLASS}
      >
        📦 投掷空投物资箱 (带降落伞)
      </Button>
      <ChoiceGroup title="✈️ 仰角爬升（指定高差）" columns={3}>
        {PLANE_ALTITUDE_STEPS_METERS.map((meters) => (
          <ChoiceButton
            key={meters}
            label={`+${meters}m`}
            onClick={() =>
              onAction({
                type: 'pitch_up',
                deltaAltitude: meters,
                speedBoostKmh: PLANE_CLIMB_BOOST_KMH
              })
            }
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup title="✈️ 俯冲下滑（指定高差）" columns={3}>
        {PLANE_ALTITUDE_STEPS_METERS.map((meters) => (
          <ChoiceButton
            key={meters}
            label={`-${meters}m`}
            onClick={() =>
              onAction({
                type: 'pitch_down',
                deltaAltitude: meters,
                speedBoostKmh: PLANE_DIVE_BOOST_KMH
              })
            }
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup title="🔄 左盘旋（机头左转后回正）" columns={4}>
        {PLANE_TURN_STEPS_DEG.map((degrees) => (
          <ChoiceButton
            key={degrees}
            label={`左${degrees}°`}
            compact
            onClick={() =>
              onAction({
                type: 'roll_turn',
                deltaHeadingDeg: -degrees,
                speedBoostKmh: PLANE_TURN_BOOST_KMH
              })
            }
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup title="🔄 右盘旋（机头右转后回正）" columns={4}>
        {PLANE_TURN_STEPS_DEG.map((degrees) => (
          <ChoiceButton
            key={degrees}
            label={`右${degrees}°`}
            compact
            onClick={() =>
              onAction({
                type: 'roll_turn',
                deltaHeadingDeg: degrees,
                speedBoostKmh: PLANE_TURN_BOOST_KMH
              })
            }
          />
        ))}
      </ChoiceGroup>
    </div>
  )
}

function FighterCommands({ onAction }: { onAction: (action: GisRoamAction) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <ChoiceGroup title="拉升（指定高差）" columns={3}>
        {FIGHTER_ALTITUDE_STEPS_METERS.map((meters) => (
          <ChoiceButton
            key={meters}
            label={`+${meters}m`}
            onClick={() =>
              onAction({
                type: 'pitch_up',
                deltaAltitude: meters,
                speedBoostKmh: FIGHTER_CLIMB_BOOST_KMH
              })
            }
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup title="俯冲（指定高差）" columns={3}>
        {FIGHTER_ALTITUDE_STEPS_METERS.map((meters) => (
          <ChoiceButton
            key={meters}
            label={`-${meters}m`}
            onClick={() =>
              onAction({
                type: 'pitch_down',
                deltaAltitude: meters,
                speedBoostKmh: FIGHTER_DIVE_BOOST_KMH
              })
            }
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup title="左压坡度" columns={4}>
        {FIGHTER_BANK_STEPS_DEG.map((degrees) => (
          <ChoiceButton
            key={degrees}
            label={`左压${degrees}°`}
            compact
            onClick={() => onAction({ type: 'roll_axis', bankDeg: -degrees })}
          />
        ))}
      </ChoiceGroup>
      <ChoiceGroup title="右压坡度" columns={4}>
        {FIGHTER_BANK_STEPS_DEG.map((degrees) => (
          <ChoiceButton
            key={degrees}
            label={`右压${degrees}°`}
            compact
            onClick={() => onAction({ type: 'roll_axis', bankDeg: degrees })}
          />
        ))}
      </ChoiceGroup>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onAction({ type: 'roll_axis', bankDeg: 0 })}
        className={COMMAND_BUTTON_CLASS}
      >
        改平
      </Button>
    </div>
  )
}

function ChoiceGroup({
  title,
  columns,
  children
}: {
  title: string
  columns: 3 | 4
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-1.5">
      <span className="text-[11px] font-medium text-foreground/75">{title}</span>
      <div className={columns === 4 ? 'grid grid-cols-4 gap-1' : 'grid grid-cols-3 gap-1'}>
        {children}
      </div>
    </div>
  )
}

function ChoiceButton({
  label,
  compact = false,
  onClick
}: {
  label: string
  compact?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-6 text-[11px] hover:bg-primary/20 hover:text-primary ${compact ? 'px-0.5' : 'px-1'}`}
    >
      {label}
    </Button>
  )
}
