import { Environment, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'

import { BimLights } from './bim-lights'

interface BimSceneProps {
  children?: React.ReactNode
}

export function BimScene({ children }: BimSceneProps) {
  return (
    <Canvas
      className="size-full"
      shadows
      camera={{ position: [14, 10, 14], fov: 60, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.15
      }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        gl.outputColorSpace = SRGBColorSpace
        gl.shadowMap.enabled = true
      }}
    >
      <color attach="background" args={['#0f172a']} />
      <OrbitControls makeDefault enableDamping target={[0, 0, 0]} maxPolarAngle={Math.PI * 0.48} />
      <Environment preset="apartment" environmentIntensity={0.85} />
      <BimLights />
      <Grid
        args={[60, 60]}
        cellColor="#1e293b"
        sectionColor="#64748b"
        fadeDistance={60}
        infiniteGrid
      />
      {children}
    </Canvas>
  )
}
