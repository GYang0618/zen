import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian3,
  Cartographic,
  Ellipsoid,
  HeightReference,
  Quaternion
} from 'cesium'

import { GIS_ACTION_CONFIG, GIS_MODEL_PATHS } from '../../constants'
import { syncAirdropOrientation } from './model'

import type { Entity, Viewer } from 'cesium'
import type { GisAirdropInfo } from '../../stores/gis-roam'

const GROUND_CONTACT_METERS = 2
const UNREPORTED_ALTITUDE = -1

interface AirdropBody {
  position: Cartesian3
  orientation: Quaternion
  fallSpeedMps: number
  groundHeight: number
  elapsedSec: number
}

const scratchCartographic = new Cartographic()

/** 一次空投任务里的物资箱。降落中的状态按帧复用，只有高度变化时才新建上报对象。 */
export class RoamAirdrops {
  private readonly bodies: AirdropBody[] = []
  private readonly entities: Entity[] = []
  private reportedAltitude = UNREPORTED_ALTITUDE
  private descending = false
  private altitudeMeters = 0
  private groundHeight = 0
  private etaSeconds = 0

  spawn(viewer: Viewer, origin: Cartesian3, groundHeight: number) {
    const position = Cartesian3.clone(origin, new Cartesian3())
    const orientation = new Quaternion()
    syncAirdropOrientation(position, orientation)

    const entity = viewer.entities.add({
      id: `gis_airdrop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: '空投',
      position: new CallbackPositionProperty(() => position, false),
      orientation: new CallbackProperty(() => orientation, false),
      model: {
        uri: GIS_MODEL_PATHS.airdrop,
        heightReference: HeightReference.NONE
      }
    })

    this.entities.push(entity)
    this.bodies.push({
      position,
      orientation,
      fallSpeedMps: GIS_ACTION_CONFIG.plane.airdrop.terminalVelocityMps,
      groundHeight,
      elapsedSec: 0
    })
  }

  /** 最新投放的箱子。相机跟它，不跟更早还在下落的箱子。 */
  latestPosition(): Cartesian3 | null {
    const latest = this.bodies[this.bodies.length - 1]
    return latest?.position ?? null
  }

  step(dt: number, onLanded: () => void) {
    this.descending = false
    for (let index = this.bodies.length - 1; index >= 0; index -= 1) {
      const body = this.bodies[index]
      const status = this.advance(body, dt)
      if (status === 'flying') {
        this.descending = true
        continue
      }
      if (status === 'landed') {
        this.bodies.splice(index, 1)
        onLanded()
      }
    }
  }

  publish(onInfo: (info: GisAirdropInfo | null) => void) {
    const altitude = this.descending ? this.altitudeMeters : UNREPORTED_ALTITUDE
    const changed = altitude !== this.reportedAltitude
    const cleared = !this.descending && this.reportedAltitude !== UNREPORTED_ALTITUDE
    if (!changed && !cleared) return

    this.reportedAltitude = altitude
    onInfo(
      this.descending
        ? {
            isDescending: true,
            altitudeMeters: this.altitudeMeters,
            groundHeight: this.groundHeight,
            etaSeconds: this.etaSeconds
          }
        : null
    )
  }

  clear(viewer: Viewer) {
    for (const entity of this.entities) viewer.entities.remove(entity)
    this.entities.length = 0
    this.bodies.length = 0
    this.reportedAltitude = UNREPORTED_ALTITUDE
    this.descending = false
  }

  private advance(body: AirdropBody, dt: number): 'flying' | 'landed' | 'unchanged' {
    body.elapsedSec += dt
    const carto = Cartographic.fromCartesian(body.position, Ellipsoid.WGS84, scratchCartographic)
    if (!carto) return 'unchanged'
    if (carto.height <= body.groundHeight + GROUND_CONTACT_METERS) return 'landed'

    carto.height -= body.fallSpeedMps * dt
    Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      carto.height,
      Ellipsoid.WGS84,
      body.position
    )
    syncAirdropOrientation(body.position, body.orientation)

    const remaining = Math.max(0, carto.height - body.groundHeight)
    this.altitudeMeters = Math.round(carto.height)
    this.groundHeight = Math.round(body.groundHeight)
    this.etaSeconds = Math.round(remaining / body.fallSpeedMps)
    return 'flying'
  }
}
