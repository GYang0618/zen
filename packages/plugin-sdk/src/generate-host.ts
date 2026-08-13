import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { PluginRegistryEntry } from './types'

function packageName(pluginId: string): string {
  return `@zen/plugin-${pluginId}`
}

function headerComment(): string {
  return `/* eslint-disable */
/**
 * 本文件由 \`zen-plugin generate\` 自动生成，请勿手工编辑。
 */
`
}

export function routeSegment(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

function iconImportName(icon: string): string {
  return icon
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function renderApiHostSource(entries: PluginRegistryEntry[]): string {
  const withApi = entries.filter((entry) => entry.api)
  const imports = withApi
    .map((entry) => `import { ${entry.api!.export} } from '${packageName(entry.id)}/api'`)
    .join('\n')
  const items = withApi
    .map((entry) => `  { id: '${entry.id}' as const, module: ${entry.api!.export} }`)
    .join(',\n')

  return `${headerComment()}${imports}

export const PLUGIN_API_LOADERS = [
${items}
] as const

export type PluginApiLoader = (typeof PLUGIN_API_LOADERS)[number]
`
}

export function renderConfigHostSource(entries: PluginRegistryEntry[]): string {
  const withConfig = entries.filter((entry) => entry.config)
  const imports = withConfig
    .map(
      (entry) =>
        `import { ${entry.config!.schemaExport} } from '${packageName(entry.id)}/config'`
    )
    .join('\n')
  const mapEntries = withConfig
    .map((entry) => `  '${entry.id}': ${entry.config!.schemaExport}`)
    .join(',\n')

  return `${headerComment()}import type { ZodType } from 'zod'
${imports ? `${imports}\n` : ''}
export const PLUGIN_CONFIG_SCHEMAS = {
${mapEntries}
} as const satisfies Record<string, ZodType>
`
}

export function renderLifecycleHostSource(entries: PluginRegistryEntry[]): string {
  const withLifecycle = entries.filter((entry) => entry.lifecycle)
  const imports = withLifecycle
    .map((entry) => {
      const alias = `lifecycle_${entry.id.replaceAll('-', '_')}`
      return `import { ${entry.lifecycle!.export} as ${alias} } from '${packageName(entry.id)}/lifecycle'`
    })
    .join('\n')
  const mapEntries = withLifecycle
    .map((entry) => {
      const alias = `lifecycle_${entry.id.replaceAll('-', '_')}`
      return `  '${entry.id}': ${alias}`
    })
    .join(',\n')

  return `${headerComment()}import type { PluginLifecycleHooks } from '@zen/plugin-sdk'
${imports ? `${imports}\n` : ''}
export const PLUGIN_LIFECYCLE_HOOKS = {
${mapEntries}
} as const satisfies Record<string, PluginLifecycleHooks>
`
}

export function renderWebRouteSource(
  entry: PluginRegistryEntry,
  route: PluginRegistryEntry['routes'][number]
): string {
  const segment = routeSegment(route.path)
  const iconName = iconImportName(route.icon)
  const pageExport = route.componentExport
  const permissions = JSON.stringify(route.permissions ?? [])
  const title = JSON.stringify(route.title)

  return `${headerComment()}import { createFileRoute } from '@tanstack/react-router'
import { ${iconName} } from 'lucide-react'
import { ${pageExport} } from '${packageName(entry.id)}/web'

import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

export const Route = createFileRoute('/_authenticated/plugins/${segment}')({
  beforeLoad: () => requireActivePlugin('${entry.id}'),
  component: function PluginRoutePage() {
    return <PluginPageShell page={${pageExport}} />
  },
  staticData: {
    title: ${title},
    icon: ${iconName},
    order: ${route.order ?? 100},
    permissions: ${permissions},
    pluginId: '${entry.id}'
  }
})
`
}

export interface HostGeneratedFile {
  relativePath: string
  absolutePath: string
  source: string
}

export function buildHostGeneratedSources(
  entries: PluginRegistryEntry[],
  rootDir: string
): HostGeneratedFile[] {
  const files: HostGeneratedFile[] = [
    {
      relativePath: 'apps/api/src/generated/plugin-api.gen.ts',
      absolutePath: join(rootDir, 'apps/api/src/generated/plugin-api.gen.ts'),
      source: `${renderApiHostSource(entries)}\n`
    },
    {
      relativePath: 'apps/api/src/generated/plugin-config.gen.ts',
      absolutePath: join(rootDir, 'apps/api/src/generated/plugin-config.gen.ts'),
      source: `${renderConfigHostSource(entries)}\n`
    },
    {
      relativePath: 'apps/api/src/generated/plugin-lifecycle.gen.ts',
      absolutePath: join(rootDir, 'apps/api/src/generated/plugin-lifecycle.gen.ts'),
      source: `${renderLifecycleHostSource(entries)}\n`
    }
  ]

  for (const entry of entries) {
    for (const route of entry.routes) {
      const segment = routeSegment(route.path)
      const relativePath = `apps/web/src/routes/_authenticated/plugins/${segment}.tsx`
      files.push({
        relativePath,
        absolutePath: join(rootDir, relativePath),
        source: `${renderWebRouteSource(entry, route)}\n`
      })
    }
  }

  return files
}

export function listExpectedPluginRouteFiles(entries: PluginRegistryEntry[]): Set<string> {
  return new Set(
    entries.flatMap((entry) => entry.routes.map((route) => `${routeSegment(route.path)}.tsx`))
  )
}

/** 清理 plugins 路由目录中不在期望集合内的薄路由（保留 route.tsx） */
export function pruneStalePluginRoutes(
  rootDir: string,
  entries: PluginRegistryEntry[],
  check: boolean
): string[] {
  const dir = join(rootDir, 'apps/web/src/routes/_authenticated/plugins')
  if (!existsSync(dir)) return []

  const keep = listExpectedPluginRouteFiles(entries)
  keep.add('route.tsx')

  const stale: string[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.tsx')) continue
    if (keep.has(name)) continue
    stale.push(`apps/web/src/routes/_authenticated/plugins/${name}`)
    if (!check) {
      unlinkSync(join(dir, name))
    }
  }

  if (check && stale.length > 0) {
    throw new Error(`发现陈旧插件路由，请运行 pnpm plugin:generate 清理: ${stale.join(', ')}`)
  }

  return stale
}

export function writeOrCheckHostFiles(
  files: HostGeneratedFile[],
  check: boolean
): { written: string[]; checked: string[] } {
  const written: string[] = []
  const checked: string[] = []

  for (const file of files) {
    if (check) {
      if (!existsSync(file.absolutePath)) {
        throw new Error(`生成物不存在，无法 --check: ${file.relativePath}`)
      }
      const existing = readFileSync(file.absolutePath, 'utf8')
      if (existing !== file.source) {
        throw new Error(
          `${file.relativePath} 与当前 plugins Manifest 不一致，请运行 pnpm plugin:generate`
        )
      }
      checked.push(file.relativePath)
      continue
    }

    mkdirSync(dirname(file.absolutePath), { recursive: true })
    writeFileSync(file.absolutePath, file.source, 'utf8')
    written.push(file.relativePath)
  }

  return { written, checked }
}
