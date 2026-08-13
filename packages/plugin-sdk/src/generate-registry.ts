import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import { findMonorepoRoot } from './discover'
import {
  buildHostGeneratedSources,
  pruneStalePluginRoutes,
  writeOrCheckHostFiles
} from './generate-host'
import { buildPluginRegistryPackageSources, writeOrCheckLoaderFiles } from './generate-loaders'
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
      dependsOn: [...manifest.dependsOn],
      permissions: manifest.permissions.map((permission) => ({ ...permission })),
      api: manifest.api ? { ...manifest.api } : undefined,
      routes: manifest.routes.map((route) => ({
        ...route,
        permissions: route.permissions ? [...route.permissions] : undefined
      })),
      config: manifest.config ? { ...manifest.config } : undefined,
      lifecycle: manifest.lifecycle ? { ...manifest.lifecycle } : undefined,
      events: manifest.events ? [...manifest.events] : undefined,
      widgets: manifest.widgets
        ? manifest.widgets.map((widget) => ({
            ...widget,
            permissions: widget.permissions ? [...widget.permissions] : undefined
          }))
        : undefined,
      agentTools: manifest.agentTools ? { ...manifest.agentTools } : undefined,
      jobs: manifest.jobs ? [...manifest.jobs] : undefined,
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
  check?: boolean
}): {
  outFile: string
  count: number
  checked?: boolean
  loaderFiles: string[]
  hostFiles: string[]
  prunedRoutes: string[]
} {
  const root = options?.rootDir ?? findMonorepoRoot()
  const outFile =
    options?.outFile ?? join(root, 'packages/plugin-sdk/src/generated/plugin-registry.gen.ts')
  const entries = buildRegistryEntries(root)
  const source = `${renderRegistrySource(entries)}\n`
  const loaderSources = buildPluginRegistryPackageSources(entries, root)
  const hostSources = buildHostGeneratedSources(entries, root)

  if (options?.check) {
    if (!existsSync(outFile)) {
      throw new Error(`注册表文件不存在，无法 --check: ${outFile}`)
    }
    const existing = readFileSync(outFile, 'utf8')
    if (existing !== source) {
      throw new Error(
        'plugin-registry.gen.ts 与当前 plugins Manifest 不一致，请运行 pnpm plugin:generate'
      )
    }
    const checkedLoaders = writeOrCheckLoaderFiles(loaderSources, true)
    const checkedHosts = writeOrCheckHostFiles(hostSources, true)
    const prunedRoutes = pruneStalePluginRoutes(root, entries, true)
    return {
      outFile,
      count: entries.length,
      checked: true,
      loaderFiles: checkedLoaders.checked,
      hostFiles: checkedHosts.checked,
      prunedRoutes
    }
  }

  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, source, 'utf8')
  const writtenLoaders = writeOrCheckLoaderFiles(loaderSources, false)
  const prunedRoutes = pruneStalePluginRoutes(root, entries, false)
  const writtenHosts = writeOrCheckHostFiles(hostSources, false)
  return {
    outFile,
    count: entries.length,
    loaderFiles: writtenLoaders.written,
    hostFiles: writtenHosts.written,
    prunedRoutes
  }
}
