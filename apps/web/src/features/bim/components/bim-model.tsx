import { Bounds, Center, useGLTF } from '@react-three/drei'

const MODEL_URL = '/models/12F.glb'

interface BimModelProps {
  url?: string
}

useGLTF.preload(MODEL_URL)

const FRAME_MARGIN = 1.35
const FRAME_DURATION_SEC = 0.9

export function BimModel({ url = MODEL_URL }: BimModelProps) {
  const { scene } = useGLTF(url)

  return (
    <Bounds fit clip observe margin={FRAME_MARGIN} maxDuration={FRAME_DURATION_SEC}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  )
}
