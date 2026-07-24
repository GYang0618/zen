import type { PluginRegistryEntry } from './types'

/**
 * 对插件依赖做拓扑排序；若有环则抛错。
 */
export function topologicalSort(plugins: Array<{ id: string; dependsOn: string[] }>): string[] {
  const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const order: string[] = []

  function visit(id: string, stack: string[]) {
    if (visited.has(id)) return
    if (visiting.has(id)) {
      throw new Error(`插件依赖存在环: ${[...stack, id].join(' -> ')}`)
    }

    const plugin = byId.get(id)
    if (!plugin) {
      throw new Error(`依赖的插件不存在: ${id}`)
    }

    visiting.add(id)
    for (const dep of plugin.dependsOn) {
      visit(dep, [...stack, id])
    }
    visiting.delete(id)
    visited.add(id)
    order.push(id)
  }

  for (const plugin of plugins) {
    visit(plugin.id, [])
  }

  return order
}

export function sortRegistryEntries(entries: PluginRegistryEntry[]): PluginRegistryEntry[] {
  const order = topologicalSort(entries)
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  return order.map((id) => {
    const entry = byId.get(id)
    if (!entry) throw new Error(`注册表缺少插件: ${id}`)
    return entry
  })
}
