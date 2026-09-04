import { DefaultAgentRunControl } from './default-agent-run-control'

describe('DefaultAgentRunControl', () => {
  it('取消只执行一次并在结束时注销', () => {
    const control = new DefaultAgentRunControl()
    const abort = jest.fn()

    control.register('run-1', abort)
    expect(control.cancel('run-1')).toBe(true)
    expect(control.cancel('run-1')).toBe(false)
    expect(abort).toHaveBeenCalledTimes(1)

    control.register('run-2', abort)
    control.unregister('run-2', abort)
    expect(control.cancel('run-2')).toBe(false)
  })
})
