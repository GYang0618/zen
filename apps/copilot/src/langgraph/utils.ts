/** 仅用于 UI 展示，不应写入 LangGraph 会话状态或回传给模型 */
export const EXCLUDED_AGUI_MESSAGE_ROLES = new Set(['reasoning', 'activity'])

interface AguiMessage {
  role: string
}

/**
 * CopilotKit 会把 `reasoning` / `activity` 留在消息历史里；回传到 LangGraph 时
 * `aguiMessagesToLangChain` 不支持这些 role，会导致第二轮起 `RUN_ERROR`。
 */
export function filterLangGraphInputMessages<T extends { messages: AguiMessage[] }>(input: T): T {
  return {
    ...input,
    messages: input.messages.filter((message) => !EXCLUDED_AGUI_MESSAGE_ROLES.has(message.role))
  }
}
