import { useDefaultRenderTool } from '@copilotkit/react-core/v2'

import { emptyToolRender } from '@/components/ai/empty-tool-render'

/** 覆盖 CopilotKit 默认工具卡片：对话里不展示「已完成 / 执行中」折叠条。 */
export function useDefaultToolUi() {
  useDefaultRenderTool({ render: emptyToolRender }, [])
}
