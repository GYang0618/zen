import { describe, expect, it } from 'vitest'

import { applyDataScope, applyOrgScopedResourceDataScope } from './apply-data-scope'
import { ContributionRegistry, filterActiveRegistryEntries } from './registry'
import { topologicalSort } from './topo-sort'
import { isPlatformCompatible, validateManifestObject } from './validate'

import type { AuthContext } from '@zen/shared'
import type { PluginRegistryEntry } from './types'

function baseAuth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    tenantId: 't1',
    userId: 'u1',
    roles: ['user'],
    permissions: [],
    isAdmin: false,
    dataScope: 'self',
    orgIds: ['org1'],
    primaryOrgId: 'org1',
    primaryOrgPath: '/t1/org1/',
    permVer: 1,
    ...overrides
  }
}

describe('topologicalSort', () => {
  it('按依赖排序', () => {
    expect(
      topologicalSort([
        { id: 'b', dependsOn: ['a'] },
        { id: 'a', dependsOn: [] },
        { id: 'c', dependsOn: ['b'] }
      ])
    ).toEqual(['a', 'b', 'c'])
  })

  it('环依赖抛错', () => {
    expect(() =>
      topologicalSort([
        { id: 'a', dependsOn: ['b'] },
        { id: 'b', dependsOn: ['a'] }
      ])
    ).toThrow(/环/)
  })
})

describe('isPlatformCompatible', () => {
  it('支持 caret range', () => {
    expect(isPlatformCompatible('^0.1.0', '0.1.0')).toBe(true)
    expect(isPlatformCompatible('^0.1.0', '0.2.0')).toBe(true)
    expect(isPlatformCompatible('^0.1.0', '1.0.0')).toBe(false)
  })
})

describe('validateManifestObject', () => {
  it('拒绝 system 权限前缀', () => {
    const issues = validateManifestObject({
      id: 'demo',
      name: 'Demo',
      version: '0.1.0',
      platformVersion: '^0.1.0',
      dependsOn: [],
      contributions: {
        permissions: [{ code: 'system:user:list', name: 'x', module: 'demo' }]
      }
    })
    expect(issues.some((issue) => issue.message.includes('内核保留前缀'))).toBe(true)
  })
})

describe('ContributionRegistry', () => {
  const entries: PluginRegistryEntry[] = [
    {
      id: 'demo',
      name: 'Demo',
      version: '0.1.0',
      platformVersion: '^0.1.0',
      dependsOn: [],
      permissions: [{ code: 'demo:note:list', name: 'list', module: 'demo' }],
      contributions: { apiModule: './api' },
      packageDir: 'plugins/demo'
    }
  ]

  it('停用后贡献点不可见', () => {
    const registry = new ContributionRegistry()
    registry.loadFromRegistry(entries)
    expect(registry.getActivePermissions()).toHaveLength(1)

    registry.setStatus('demo', 'inactive')
    expect(registry.getActivePermissions()).toHaveLength(0)
    expect(registry.getActiveApiModules()).toHaveLength(0)
    expect(filterActiveRegistryEntries(entries, new Map([['demo', 'inactive']]))).toHaveLength(0)
  })
})

describe('applyOrgScopedResourceDataScope', () => {
  it('org_and_child 走 organization.path', () => {
    expect(applyOrgScopedResourceDataScope(baseAuth({ dataScope: 'org_and_child' }))).toEqual({
      organization: { path: { startsWith: '/t1/org1/' } }
    })
  })

  it('self 走 createdBy', () => {
    expect(applyDataScope(baseAuth({ dataScope: 'self' }))).toEqual({ createdBy: 'u1' })
  })
})
