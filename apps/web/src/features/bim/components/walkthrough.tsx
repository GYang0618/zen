import { Line, Sphere } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { CatmullRomCurve3, Raycaster, Vector3 } from 'three'

import {
  WALKTHROUGH_CAMERA_LOOK_HEIGHT,
  WALKTHROUGH_COLLISION_ENABLED,
  WALKTHROUGH_LOOK_AHEAD,
  WALKTHROUGH_PICK_DRAG_THRESHOLD_PX,
  WALKTHROUGH_SPEED
} from '../constants'
import {
  collectSolidWalkMeshes,
  hideSpaceMeshes,
  pickWalkthroughFloorHit,
  resolveFollowCamera,
  resolveWalkthroughMove
} from '../lib/walkthrough'
import { useWalkthroughStore } from '../stores/walkthrough'
import { WalkthroughAvatar } from './walkthrough-avatar'

import type { Group, Mesh } from 'three'
import type { WalkthroughPoint } from '../stores/walkthrough'

type OrbitControlsLike = {
  enabled: boolean
  target: Vector3
  update: () => void
}

function toFloorPosition(point: WalkthroughPoint): Vector3 {
  return new Vector3(point.x, point.y, point.z)
}

function WalkthroughMarkers() {
  const waypoints = useWalkthroughStore((state) => state.waypoints)
  const phase = useWalkthroughStore((state) => state.phase)

  if (waypoints.length === 0 || phase === 'idle' || phase === 'walking') return null

  const positions = waypoints.map(
    (point) => [point.x, point.y + 0.05, point.z] as [number, number, number]
  )

  return (
    <group userData={{ walkthroughHelper: true }}>
      {waypoints.map((point, index) => (
        <Sphere
          key={`${point.x}-${point.y}-${point.z}-${index}`}
          args={[0.12, 16, 16]}
          position={[point.x, point.y + 0.12, point.z]}
          userData={{ walkthroughHelper: true }}
        >
          <meshBasicMaterial color={index === 0 ? '#22c55e' : '#38bdf8'} depthTest={false} />
        </Sphere>
      ))}
      {positions.length >= 2 && (
        <Line points={positions} color="#38bdf8" lineWidth={2} depthTest={false} />
      )}
    </group>
  )
}

function WalkthroughPicker() {
  const phase = useWalkthroughStore((state) => state.phase)
  const addWaypoint = useWalkthroughStore((state) => state.addWaypoint)
  const { camera, scene, gl, raycaster, pointer, invalidate } = useThree()
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (phase !== 'picking') return
    const restoreSpaces = hideSpaceMeshes(scene)
    invalidate()
    return () => {
      restoreSpaces()
      invalidate()
    }
  }, [phase, scene, invalidate])

  useEffect(() => {
    if (phase !== 'picking') return

    const element = gl.domElement

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      pointerDownRef.current = { x: event.clientX, y: event.clientY }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0) return
      const start = pointerDownRef.current
      pointerDownRef.current = null
      if (!start) return

      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (Math.hypot(dx, dy) > WALKTHROUGH_PICK_DRAG_THRESHOLD_PX) return

      const rect = element.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      const hits = raycaster.intersectObjects(scene.children, true)
      const hit = pickWalkthroughFloorHit(hits)
      if (!hit) return

      addWaypoint({
        x: Number(hit.point.x.toFixed(3)),
        y: Number(hit.point.y.toFixed(3)),
        z: Number(hit.point.z.toFixed(3))
      })
      invalidate()
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointerup', onPointerUp)
    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointerup', onPointerUp)
    }
  }, [phase, addWaypoint, camera, scene, gl, raycaster, pointer, invalidate])

  return null
}

function WalkthroughRunner() {
  const phase = useWalkthroughStore((state) => state.phase)
  const waypoints = useWalkthroughStore((state) => state.waypoints)
  const finishWalkthrough = useWalkthroughStore((state) => state.finishWalkthrough)
  const isWalking = phase === 'walking'

  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null
  const invalidate = useThree((state) => state.invalidate)
  const setFrameloop = useThree((state) => state.set)

  const avatarRef = useRef<Group>(null)
  const moveDistanceRef = useRef(0)
  const progressRef = useRef(0)
  const curveRef = useRef<CatmullRomCurve3 | null>(null)
  const collidersRef = useRef<Mesh[]>([])
  const raycasterRef = useRef(new Raycaster())
  const desiredRef = useRef(new Vector3())
  const resolvedRef = useRef(new Vector3())
  const lookAheadRef = useRef(new Vector3())
  const forwardRef = useRef(new Vector3(0, 0, 1))
  const cameraPosRef = useRef(new Vector3())
  const lookAtRef = useRef(new Vector3())
  const prevPosRef = useRef(new Vector3())

  useLayoutEffect(() => {
    if (!isWalking || waypoints.length < 2) {
      curveRef.current = null
      collidersRef.current = []
      moveDistanceRef.current = 0
      return
    }

    const points = waypoints.map(toFloorPosition)
    curveRef.current = new CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    collidersRef.current = collectSolidWalkMeshes(scene)
    progressRef.current = 0

    const start = curveRef.current.getPoint(0)
    prevPosRef.current.copy(start)
    if (avatarRef.current) {
      avatarRef.current.position.copy(start)
    }

    if (controls) controls.enabled = false
    // demand 模式下仅靠 always 切换不可靠，用 invalidate 泵帧
    setFrameloop({ frameloop: 'always' })
    invalidate()

    return () => {
      if (controls) {
        controls.enabled = true
        controls.target.copy(lookAtRef.current)
        controls.update()
      }
      setFrameloop({ frameloop: 'demand' })
      invalidate()
    }
  }, [isWalking, waypoints, controls, scene, invalidate, setFrameloop])

  useFrame((_, delta) => {
    if (!isWalking) return

    // 人物尚未挂载或路径未就绪时继续请求帧，避免卡死在 demand
    if (!curveRef.current || !avatarRef.current) {
      invalidate()
      return
    }

    const curve = curveRef.current
    const avatar = avatarRef.current
    const length = Math.max(curve.getLength(), 0.001)
    progressRef.current += (WALKTHROUGH_SPEED * delta) / length

    const finished = progressRef.current >= 1
    const t = finished ? 1 : progressRef.current

    curve.getPoint(t, desiredRef.current)
    if (WALKTHROUGH_COLLISION_ENABLED) {
      resolveWalkthroughMove(
        avatar.position,
        desiredRef.current,
        collidersRef.current,
        raycasterRef.current,
        resolvedRef.current
      )
    } else {
      resolvedRef.current.copy(desiredRef.current)
    }

    moveDistanceRef.current = prevPosRef.current.distanceTo(resolvedRef.current)
    prevPosRef.current.copy(resolvedRef.current)
    avatar.position.copy(resolvedRef.current)

    curve.getPoint(Math.min(t + WALKTHROUGH_LOOK_AHEAD, 1), lookAheadRef.current)
    forwardRef.current.set(
      lookAheadRef.current.x - avatar.position.x,
      0,
      lookAheadRef.current.z - avatar.position.z
    )
    if (forwardRef.current.lengthSq() > 1e-6) {
      avatar.rotation.y = Math.atan2(forwardRef.current.x, forwardRef.current.z)
    }

    resolveFollowCamera(
      avatar.position,
      forwardRef.current,
      collidersRef.current,
      raycasterRef.current,
      cameraPosRef.current
    )
    camera.position.copy(cameraPosRef.current)
    lookAtRef.current.set(
      avatar.position.x,
      avatar.position.y + WALKTHROUGH_CAMERA_LOOK_HEIGHT,
      avatar.position.z
    )
    camera.lookAt(lookAtRef.current)

    if (finished) {
      moveDistanceRef.current = 0
      finishWalkthrough()
      return
    }

    invalidate()
  })

  if (!isWalking) return null

  return <WalkthroughAvatar groupRef={avatarRef} moveDistanceRef={moveDistanceRef} active={isWalking} />
}

/** 室内漫游：点位拾取、人物步行、第三人称跟随（含碰撞） */
export function Walkthrough() {
  return (
    <>
      <WalkthroughPicker />
      <WalkthroughMarkers />
      <WalkthroughRunner />
    </>
  )
}
