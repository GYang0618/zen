import { ConstantProperty } from 'cesium'
import { useEffect, useRef } from 'react'

import { useCesium } from '../cesium-provider'
import { releaseRoamCamera } from '../lib/roam/camera'
import { roamModelVisible } from '../lib/roam/model'
import { createRoamRoute, removeRoamRoute } from '../lib/roam/route'
import { startRoamSimulation } from '../lib/roam/simulation'
import { useGisRoamStore } from '../stores/gis-roam'

import type { Entity } from 'cesium'

export function RoamRunner() {
  const { viewer } = useCesium()
  const phase = useGisRoamStore((state) => state.phase)
  const waypoints = useGisRoamStore((state) => state.waypoints)
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const viewMode = useGisRoamStore((state) => state.viewMode)
  const restartCount = useGisRoamStore((state) => state.restartCount)
  const stopRoam = useGisRoamStore((state) => state.stopRoam)
  const clearAction = useGisRoamStore((state) => state.clearAction)
  const updatePhysicsState = useGisRoamStore((state) => state.updatePhysicsState)
  const setViewTarget = useGisRoamStore((state) => state.setViewTarget)
  const setAirdropInfo = useGisRoamStore((state) => state.setAirdropInfo)
  const entityRef = useRef<Entity | null>(null)
  const routeRef = useRef<Entity | null>(null)
  const active = phase === 'roaming' || phase === 'paused'

  useEffect(() => {
    if (phase === 'idle' || waypoints.length < 2) {
      removeRoamRoute(viewer, routeRef.current)
      routeRef.current = null
      return
    }

    routeRef.current = createRoamRoute(viewer, waypoints, vehicleType)
    return () => {
      removeRoamRoute(viewer, routeRef.current)
      routeRef.current = null
    }
  }, [viewer, phase, waypoints, vehicleType])

  useEffect(() => {
    const model = entityRef.current?.model
    if (!model) return
    model.show = new ConstantProperty(roamModelVisible(vehicleType, viewMode))
  }, [viewMode, vehicleType])

  useEffect(() => {
    // 重新漫游只递增 restartCount。显式依赖它，效应才会拆掉当前会话并从头积分。
    void restartCount
    if (!active || waypoints.length < 2) {
      releaseRoamCamera(viewer)
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      if (viewer.trackedEntity) viewer.trackedEntity = undefined
      return
    }

    return (
      startRoamSimulation({
        viewer,
        vehicleType,
        waypoints,
        entityRef,
        hooks: { stopRoam, clearAction, updatePhysicsState, setViewTarget, setAirdropInfo }
      }) ?? undefined
    )
  }, [
    viewer,
    active,
    waypoints,
    vehicleType,
    restartCount,
    stopRoam,
    clearAction,
    updatePhysicsState,
    setViewTarget,
    setAirdropInfo
  ])

  return null
}
