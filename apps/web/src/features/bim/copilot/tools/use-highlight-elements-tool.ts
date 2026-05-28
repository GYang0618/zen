import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { bimMeshRegistry } from '../../lib/mesh-registry'
import { useBimStore } from '../../stores/bim'

const highlightElementsSchema = z.object({
  elementIds: z.array(z.string()).describe('构件id，gltfExtensions.id > userData.id > uuid'),
  mode: z
    .enum(['replace', 'append', 'clear'])
    .default('replace')
    .describe('replace=替换选中；append=追加；clear=清除全部高亮')
})

export function useHighlightElementsTool() {
  useFrontendTool({
    name: 'highlight_elements',
    description:
      '高亮 BIM 构件（通过 elementId）。构件 id 来自导出模型的 userData.elementId，未设置时使用 mesh uuid。',
    parameters: highlightElementsSchema,
    handler: async ({ elementIds, mode }) => {
      const { setSelection, selectElement, clearSelection } = useBimStore.getState()

      if (mode === 'clear') {
        clearSelection()
        return { status: 'success', message: '已清除构件高亮' }
      }

      const found: string[] = []
      const missing: string[] = []

      for (const elementId of elementIds) {
        if (bimMeshRegistry.has(elementId)) found.push(elementId)
        else missing.push(elementId)
      }

      if (found.length === 0) {
        return {
          status: 'error',
          message: '未找到可高亮的构件，请确认模型已加载且 elementId 正确',
          missing
        }
      }

      if (mode === 'replace') {
        setSelection(found)
      } else {
        for (const elementId of found) {
          selectElement(elementId, { append: true })
        }
      }

      return {
        status: 'success',
        message: `已高亮 ${found.length} 个构件`,
        highlighted: found,
        ...(missing.length > 0 ? { missing } : {})
      }
    }
  })
}
