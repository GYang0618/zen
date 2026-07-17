import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils } from 'three'

import { WALKTHROUGH_WALK_CYCLE_SPEED } from '../constants'

import type { RefObject } from 'react'
import type { Group } from 'three'

interface WalkthroughAvatarProps {
  groupRef: RefObject<Group | null>
  /** 本帧水平移动距离，用于驱动步态 */
  moveDistanceRef: RefObject<number>
  active: boolean
}

const LIMB_SWING = 0.55
const ARM_SWING = 0.45
const BODY_BOB = 0.03

/**
 * 程序化低模行人：漫游时沿路径步行摆动。
 * 后续可替换为带 walk 动画的 GLB（useGLTF + useAnimations）。
 */
export function WalkthroughAvatar({ groupRef, moveDistanceRef, active }: WalkthroughAvatarProps) {
  const leftLegRef = useRef<Group>(null)
  const rightLegRef = useRef<Group>(null)
  const leftArmRef = useRef<Group>(null)
  const rightArmRef = useRef<Group>(null)
  const torsoRef = useRef<Group>(null)
  const cycleRef = useRef(0)

  useFrame((_, delta) => {
    const moving = active && (moveDistanceRef.current ?? 0) > 0.001
    if (moving) {
      cycleRef.current += delta * WALKTHROUGH_WALK_CYCLE_SPEED
    } else {
      cycleRef.current = MathUtils.damp(cycleRef.current, 0, 4, delta)
    }

    const swing = Math.sin(cycleRef.current)
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * LIMB_SWING
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * LIMB_SWING
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * ARM_SWING
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * ARM_SWING
    if (torsoRef.current) {
      torsoRef.current.position.y = Math.abs(swing) * BODY_BOB
    }
  })

  return (
    <group ref={groupRef} userData={{ walkthroughHelper: true }}>
      <group ref={torsoRef}>
        <mesh position={[0, 1.55, 0]} userData={{ walkthroughHelper: true }}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#f0c7a0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.05, 0]} userData={{ walkthroughHelper: true }}>
          <capsuleGeometry args={[0.18, 0.45, 6, 12]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.65} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[-0.28, 1.35, 0]}>
        <mesh position={[0, -0.28, 0]} userData={{ walkthroughHelper: true }}>
          <capsuleGeometry args={[0.05, 0.32, 4, 8]} />
          <meshStandardMaterial color="#2563eb" roughness={0.65} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.28, 1.35, 0]}>
        <mesh position={[0, -0.28, 0]} userData={{ walkthroughHelper: true }}>
          <capsuleGeometry args={[0.05, 0.32, 4, 8]} />
          <meshStandardMaterial color="#2563eb" roughness={0.65} />
        </mesh>
      </group>

      <group ref={leftLegRef} position={[-0.1, 0.85, 0]}>
        <mesh position={[0, -0.4, 0]} userData={{ walkthroughHelper: true }}>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.85, 0]}>
        <mesh position={[0, -0.4, 0]} userData={{ walkthroughHelper: true }}>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}
