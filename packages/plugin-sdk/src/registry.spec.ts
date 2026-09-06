import { describe, expect, it } from 'vitest'

import { applyDataScope, applyOrgScopedResourceDataScope } from './apply-data-scope.js'
import { ContributionRegistry, filterActiveRegistryEntries } from './registry.js'
import { topologicalSort } from './topo-sort.js'
import { isPlatformCompatible, resolvePluginEntry, validateManifestObject } from './validate.js'

import type { AuthContext } from '@zen/shared'
import type { PluginRegistryEntry } from './types.js'

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

function demoEntry(overrides: Partial<PluginRegistryEntry> = {}): PluginRegistryEntry {
  return {
    id: 'demo',
    name: 'Demo',
    version: '0.1.0',
    platformVersion: '^0.1.0',
    dependsOn: [],
    permissions: [{ code: 'demo:note:list', name: 'list', module: 'demo' }],
    routes: [],
    api: { entry: './api', export: 'DemoModule' },
    packageDir: 'plugins/demo',
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
      permissions: [{ code: 'system:user:list', name: 'x', module: 'demo' }],
      routes: []
    })
    expect(issues.some((issue) => issue.message.includes('内核保留前缀'))).toBe(true)
  })

  it('拒绝未知 icon', () => {
    const issues = validateManifestObject({
      id: 'demo',
      name: 'Demo',
      version: '0.1.0',
      platformVersion: '^0.1.0',
      dependsOn: [],
      permissions: [],
      routes: [
        {
          id: 'demo-home',
          path: '/plugins/demo',
          entry: './src/page',
          componentExport: 'Page',
          title: 'Demo',
          icon: 'not-a-real-icon'
        }
      ]
    })
    expect(issues.some((issue) => issue.message.includes('未知 icon'))).toBe(true)
  })

  it('拒绝未声明的 route.permissions', () => {
    const issues = validateManifestObject({
      id: 'demo',
      name: 'Demo',
      version: '0.1.0',
      platformVersion: '^0.1.0',
      dependsOn: [],
      permissions: [{ code: 'demo:note:list', name: 'list', module: 'demo' }],
      routes: [
        {
          id: 'demo-home',
          path: '/plugins/demo',
          entry: './src/page',
          componentExport: 'Page',
          title: 'Demo',
          icon: 'sticky-note',
          permissions: ['demo:note:delete']
        }
      ]
    })
    expect(issues.some((issue) => issue.message.includes('未在本插件 permissions 中声明'))).toBe(
      true
    )
  })
})

describe('resolvePluginEntry', () => {
  it('拒绝逃逸插件目录的入口', () => {
    const result = resolvePluginEntry(process.cwd(), '../../etc/passwd')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/逃逸/)
    }
  })
})

describe('ContributionRegistry', () => {
  const entries: PluginRegistryEntry[] = [demoEntry()]

  it('fail-closed：默认 inactive，启用后贡献点可见', () => {
    const registry = new ContributionRegistry()
    registry.loadFromRegistry(entries)
    expect(registry.getActivePermissions()).toHaveLength(0)
    expect(registry.getActiveApiModules()).toHaveLength(0)

    registry.setStatus('demo', 'active')
    expect(registry.getActivePermissions()).toHaveLength(1)
    expect(registry.getActiveApiModules()).toHaveLength(1)

    registry.setStatus('demo', 'inactive')
    expect(registry.getActivePermissions()).toHaveLength(0)
    expect(filterActiveRegistryEntries(entries, new Map([['demo', 'inactive']]))).toHaveLength(0)
  })

  it('filterActiveRegistryEntries 缺省 status 为 inactive', () => {
    expect(filterActiveRegistryEntries(entries, new Map())).toHaveLength(0)
    expect(filterActiveRegistryEntries(entries, new Map([['demo', 'active']]))).toHaveLength(1)
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
