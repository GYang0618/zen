import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'

import type * as Registry from './registry'

let registry: typeof Registry

before(async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.LANGSMITH_API_KEY = 'test-langsmith-key'
  registry = await import('./registry')
})

describe('Default Agent tool registry', () => {
  it('聚合后的 Tool 名称唯一', () => {
    const names = registry.defaultAgentTools.map((tool) => tool.name)
    assert.equal(new Set(names).size, names.length)
  })

  it('每个 Tool 都具有完整执行元数据', () => {
    assert.equal(registry.defaultAgentToolDescriptors.length, registry.defaultAgentTools.length)
    for (const descriptor of registry.defaultAgentToolDescriptors) {
      assert.ok(descriptor.inputSchema)
      assert.ok(descriptor.timeoutMs > 0)
      assert.ok(['low', 'medium', 'high', 'critical'].includes(descriptor.riskLevel))
      assert.ok(['none', 'write', 'destructive'].includes(descriptor.sideEffect))
    }
  })

  it('装载生成的插件 Tool 并保留插件身份', () => {
    assert.ok(
      registry.defaultAgentTools.some((registeredTool) => registeredTool.name === 'list_demo_notes')
    )
    assert.equal(registry.getAgentToolPluginId('list_demo_notes'), 'demo-notes')
    assert.deepEqual(registry.getActivePluginAgentPrompts([]), [])
    assert.equal(registry.getActivePluginAgentPrompts(['demo-notes']).length, 1)
  })

  it('拒绝不同 provider 注册同名 Tool', () => {
    const tool = registry.defaultAgentTools[0]
    assert.ok(tool)
    assert.throws(
      () =>
        registry.createAgentToolRegistry([
          { id: 'one', tools: [tool] },
          { id: 'two', tools: [tool] }
        ]),
      /Duplicate agent tool name/
    )
  })
})
