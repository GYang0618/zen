import { describe, expect, it } from 'vitest'

import source from './chat-approval.tsx?raw'

describe('LangGraph HITL', () => {
  it('使用 CopilotKit v2 useInterrupt，而不是 useHumanInTheLoop', () => {
    expect(source).toContain("from '@copilotkit/react-core/v2'")
    expect(source).toContain('useInterrupt')
    expect(source).toContain('event={event}')
    expect(source).not.toContain('useHumanInTheLoop')
  })
})
