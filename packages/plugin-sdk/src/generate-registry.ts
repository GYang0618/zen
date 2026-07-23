import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import { findMonorepoRoot } from './discover'
import { sortRegistryEntries } from './topo-sort'
import { validatePlugins } from './validate'

import type { PluginRegistryEntry } from './types'

export function buildRegistryEntries(rootDir?: string): PluginRegistryEntry[] {
  const root = rootDir ?? findMonorepoRoot()
  const result = validatePlugins(root)
  if (!result.ok) {
    const errors = result.issues
      .filter((issue) => issue.level === 'error')
      .map((issue) => issue.message)
      .join('\n')
    throw new Error(`插件校验失败，无法生成注册表:\n${errors}`)
  }

  const entries: PluginRegistryEntry[] = result.plugins.map((plugin) => {
    const { manifest, dir } = plugin
    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      platformVersion: manifest.platformVersion,
      dependsOn: manifest.dependsOn,
      permissions: manifest.contributions.permissions,
      contributions: {
        routes: manifest.contributions.routes,
        menus: manifest.contributions.menus,
        widgets: manifest.contributions.widgets,
        apiModule: manifest.contributions.apiModule,
        agentTools: manifest.contributions.agentTools,
        events: manifest.contributions.events,
        jobs: manifest.contributions.jobs,
        configSchema: manifest.contributions.configSchema
      },
      lifecycle: manifest.lifecycle,
      packageDir: relative(root, dir).replaceAll('\\', '/')
    }
  })

  return sortRegistryEntries(entries)
}

export function renderRegistrySource(entries: PluginRegistryEntry[]): string {
  const payload = JSON.stringify(entries, null, 2)
  return `/* eslint-disable */
/**
 * 本文件由 \`zen-plugin generate\` 自动生成，请勿手工编辑。
 */
import type { PluginRegistryEntry } from '../types'

export const PLUGIN_REGISTRY = ${payload} as const satisfies readonly PluginRegistryEntry[]

export type GeneratedPluginId = (typeof PLUGIN_REGISTRY)[number]['id']
`
}

export function generatePluginRegistry(options?: {
  rootDir?: string
  outFile?: string
}): { outFile: string; count: number } {
  const root = options?.rootDir ?? findMonorepoRoot()
  const outFile =
    options?.outFile ??
    join(root, 'packages/plugin-sdk/src/generated/plugin-registry.gen.ts')
  const entries = buildRegistryEntries(root)
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, `${renderRegistrySource(entries)}\n`, 'utf8')
  return { outFile, count: entries.length }
}
