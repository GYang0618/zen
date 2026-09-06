import { copilotKitBasePath } from './copilot.service.js'

describe('copilotKitBasePath', () => {
  it('与前端 runtimeUrl 对齐，挂在 API 前缀下的 /copilot', () => {
    expect(copilotKitBasePath('/api')).toBe('/api/copilot')
    expect(copilotKitBasePath('api')).toBe('/api/copilot')
    expect(copilotKitBasePath('/api/')).toBe('/api/copilot')
  })
})
