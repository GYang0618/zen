import { Color, PolylineGlowMaterialProperty } from 'cesium'

import {
  createFlightTrajectory,
  createGroundTrajectory,
  createPatrolTrajectory
} from '../geo-utils'
import { isAirVehicle } from './model'

import type { Cartesian3, Entity, Viewer } from 'cesium'
import type { GisRoamVehicle, GisWaypoint } from '../../stores/gis-roam'

const ROAM_ROUTE_ID = 'gis_roam_route'
const AIR_ROUTE_COLOR = '#38bdf8'
const GROUND_ROUTE_COLOR = '#06b6d4'
const AIR_ROUTE_GLOW = 0.25
const GROUND_ROUTE_GLOW = 0.35
const AIR_ROUTE_WIDTH = 6
const GROUND_ROUTE_WIDTH = 8

export function createRoamRoute(
  viewer: Viewer,
  waypoints: GisWaypoint[],
  vehicleType: GisRoamVehicle
) {
  const positions = routePositions(waypoints, vehicleType)
  if (positions.length < 2) return null

  const air = isAirVehicle(vehicleType)
  return viewer.entities.add({
    id: ROAM_ROUTE_ID,
    name: '漫游路线',
    polyline: {
      positions,
      width: air ? AIR_ROUTE_WIDTH : GROUND_ROUTE_WIDTH,
      material: new PolylineGlowMaterialProperty({
        glowPower: air ? AIR_ROUTE_GLOW : GROUND_ROUTE_GLOW,
        color: Color.fromCssColorString(air ? AIR_ROUTE_COLOR : GROUND_ROUTE_COLOR)
      }),
      clampToGround: !air
    }
  })
}

export function removeRoamRoute(viewer: Viewer, entity: Entity | null) {
  if (!entity) return
  viewer.entities.remove(entity)
}

function routePositions(waypoints: GisWaypoint[], vehicleType: GisRoamVehicle): Cartesian3[] {
  if (vehicleType === 'fighter') return createPatrolTrajectory(waypoints)?.positions ?? []
  if (isAirVehicle(vehicleType)) return createFlightTrajectory(waypoints)?.positions ?? []
  return createGroundTrajectory(waypoints)?.positions ?? []
}
