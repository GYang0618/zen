import type { ReactElement } from 'react'

/** CopilotKit 的 render 必须返回 ReactElement，不能返回 null。 */
export function emptyToolRender(): ReactElement {
  return <span hidden />
}
