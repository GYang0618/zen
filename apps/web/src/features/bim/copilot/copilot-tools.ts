import { useHighlightElementsTool } from './tools/use-highlight-elements-tool'
import { useLoadModelTool } from './tools/use-load-model-tool'
import { useQueryPropertiesTool } from './tools/use-query-properties-tool'

/** Canvas 内统一注册 BIM AI 前端工具 */
export function useCopilotTools() {
  useLoadModelTool()
  useQueryPropertiesTool()
  useHighlightElementsTool()
}
