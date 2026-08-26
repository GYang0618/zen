import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import type { Mesh } from 'three'

export function Cube3D() {
  return (
    <Canvas camera={{ position: [4, 3, 6], fov: 50 }}>
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={1.25} />
      <SpinningCube />
    </Canvas>
  )
}

function SpinningCube() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.x += delta * 0.6
    mesh.rotation.y += delta * 0.4
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" metalness={0.2} roughness={0.4} />
    </mesh>
  )
}
