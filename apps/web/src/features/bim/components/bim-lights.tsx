const KEY_LIGHT_INTENSITY = 1.35
const FILL_LIGHT_INTENSITY = 0.55
const RIM_LIGHT_INTENSITY = 0.4
const HEMISPHERE_INTENSITY = 0.65
const AMBIENT_INTENSITY = 0.35

export function BimLights() {
  return (
    <>
      <hemisphereLight args={['#e2e8f0', '#1e293b', HEMISPHERE_INTENSITY]} position={[0, 50, 0]} />
      <ambientLight args={['#ffffff', AMBIENT_INTENSITY]} />
      <directionalLight
        color="#ffffff"
        intensity={KEY_LIGHT_INTENSITY}
        position={[24, 32, 18]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0002}
      />
      <directionalLight
        color="#c7d2fe"
        intensity={FILL_LIGHT_INTENSITY}
        position={[-18, 14, -12]}
      />
      <directionalLight color="#f8fafc" intensity={RIM_LIGHT_INTENSITY} position={[-10, 12, -24]} />
    </>
  )
}
