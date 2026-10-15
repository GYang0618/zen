import { LoadingState } from '@/components/loading-state'

const SCENE_STATUS_LABEL = '正在初始化三维地球'

type SceneLoadingProps = {
  active: boolean
}

export function SceneLoading({ active }: SceneLoadingProps) {
  if (!active) return null

  return <LoadingState label={SCENE_STATUS_LABEL} className="absolute inset-0 z-20" />
}
