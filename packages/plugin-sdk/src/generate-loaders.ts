import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

export function renderCatalogSource(entries: PluginRegistryEntry[]): string {
  const payload = JSON.stringify(entries, null, 2)
  return `${headerComment()}import type { PluginRegistryEntry } from '@zen/plugin-sdk'

export const PLUGIN_CATALOG = ${payload} as const satisfies readonly PluginRegistryEntry[]

export type CatalogPluginId = (typeof PLUGIN_CATALOG)[number]['id']
`
}

export function renderApiLoaderSource(entries: PluginRegistryEntry[]): string {
  const withApi = entries.filter((entry) => entry.api)
  const imports = withApi
    .map(
      (entry) =>
        `import { ${entry.api!.export} } from '${packageName(entry.id)}/api'`
    )
    .join('\n')

  const items = withApi
    .map(
      (entry) =>
        `  { id: '${entry.id}' as const, module: ${entry.api!.export} }`
    )
    .join(',\n')

  return `${headerComment()}${imports}

export const PLUGIN_API_LOADERS = [
${items}
] as const

export type PluginApiLoader = (typeof PLUGIN_API_LOADERS)[number]
`
}

export function renderWebLoaderSource(entries: PluginRegistryEntry[]): string {
  const routes = entries.flatMap((entry) =>
    entry.routes.map((route) => ({ pluginId: entry.id, route }))
  )

  const items = routes
    .map(({ pluginId, route }) => {
      return `  {
    pluginId: '${pluginId}' as const,
    routeId: '${route.id}' as const,
    path: '${route.path}' as const,
    title: ${JSON.stringify(route.title)},
    icon: '${route.icon}' as const,
    order: ${route.order ?? 100},
    permissions: ${JSON.stringify(route.permissions ?? [])} as readonly string[],
    packageName: '${packageName(pluginId)}' as const,
    componentExport: '${route.componentExport}' as const
  }`
    })
    .join(',\n')

  return `${headerComment()}export interface PluginWebRouteLoader {
  pluginId: string
  routeId: string
  path: string
  title: string
  icon: string
  order: number
  permissions: readonly string[]
  packageName: string
  componentExport: string
}

export const PLUGIN_WEB_ROUTES = [
${items}
] as const satisfies readonly PluginWebRouteLoader[]
`
}

export function renderConfigLoaderSource(entries: PluginRegistryEntry[]): string {
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

export type PluginConfigSchemaId = keyof typeof PLUGIN_CONFIG_SCHEMAS
`
}

export function renderLifecycleLoaderSource(entries: PluginRegistryEntry[]): string {
  const withLifecycle = entries.filter((entry) => entry.lifecycle)
  const imports = withLifecycle
    .map(
      (entry) =>
        `import { ${entry.lifecycle!.export} as lifecycle_${entry.id.replaceAll('-', '_')} } from '${packageName(entry.id)}/lifecycle'`
    )
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

export type PluginLifecycleId = keyof typeof PLUGIN_LIFECYCLE_HOOKS
`
}

export interface GeneratedLoaderFiles {
  relativePath: string
  absolutePath: string
  source: string
}

export function buildPluginRegistryPackageSources(
  entries: PluginRegistryEntry[],
  rootDir: string
): GeneratedLoaderFiles[] {
  const base = join(rootDir, 'packages/plugin-registry/src/generated')
  return [
    {
      relativePath: 'packages/plugin-registry/src/generated/catalog.gen.ts',
      absolutePath: join(base, 'catalog.gen.ts'),
      source: `${renderCatalogSource(entries)}\n`
    },
    {
      relativePath: 'packages/plugin-registry/src/generated/api.gen.ts',
      absolutePath: join(base, 'api.gen.ts'),
      source: `${renderApiLoaderSource(entries)}\n`
    },
    {
      relativePath: 'packages/plugin-registry/src/generated/web.gen.ts',
      absolutePath: join(base, 'web.gen.ts'),
      source: `${renderWebLoaderSource(entries)}\n`
    },
    {
      relativePath: 'packages/plugin-registry/src/generated/config.gen.ts',
      absolutePath: join(base, 'config.gen.ts'),
      source: `${renderConfigLoaderSource(entries)}\n`
    },
    {
      relativePath: 'packages/plugin-registry/src/generated/lifecycle.gen.ts',
      absolutePath: join(base, 'lifecycle.gen.ts'),
      source: `${renderLifecycleLoaderSource(entries)}\n`
    }
  ]
}

export function writeOrCheckLoaderFiles(
  files: GeneratedLoaderFiles[],
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
