/** 停止按钮只通知服务端时，浏览器仍会继续读 SSE。这里直接中止当前这次请求。 */
export function abortAgentHttpStream(agent: object): void {
  if (!('abortController' in agent)) return
  const controller = agent.abortController
  if (!(controller instanceof AbortController) || controller.signal.aborted) return
  controller.abort()
}
