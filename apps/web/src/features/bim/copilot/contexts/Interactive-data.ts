import { useAgentContext } from '@copilotkit/react-core/v2'

import { useModelStore } from '../../stores/model'

export function useInteractiveDataContext() {
  const selectedElementIds = useModelStore((state) => state.selectedElementIds)
  useAgentContext({
    description: '选中的构件id列表',
    value: selectedElementIds
  })
}
