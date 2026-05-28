import { useHighlightElementsTool, useLoadModelTool, useQueryObjectPropTool } from './tools'

/** Canvas 内统一注册 BIM AI 前端工具 */
export function useCopilotTools() {
  useLoadModelTool()
  useQueryObjectPropTool()
  useHighlightElementsTool()
}
