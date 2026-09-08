import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PLUGIN_MANIFEST_FILENAME, PLUGINS_GLOB_DIR } from './constants.js'
import { zenPluginManifestSchema } from './manifest.schema.js'

import type { DiscoveredPlugin } from './types.js'

export function findMonorepoRoot(startDir = process.cwd()): string {
  let current = startDir
  for (;;) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      return current
    }
    const parent = join(current, '..')
    if (parent === current) {
      throw new Error('未找到 monorepo 根目录（缺少 pnpm-workspace.yaml）')
    }
    current = parent
  }
}

export function discoverPlugins(rootDir?: string): DiscoveredPlugin[] {
  const root = rootDir ?? findMonorepoRoot()
  const pluginsRoot = join(root, PLUGINS_GLOB_DIR)
  if (!existsSync(pluginsRoot)) {
    return []
  }

  const entries = readdirSync(pluginsRoot, { withFileTypes: true })
  const discovered: DiscoveredPlugin[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.')) continue

    const dir = join(pluginsRoot, entry.name)
    const manifestPath = join(dir, PLUGIN_MANIFEST_FILENAME)
    if (!existsSync(manifestPath)) continue

    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown
    const parsed = zenPluginManifestSchema.safeParse(raw)
    if (!parsed.success) {
      const detail = parsed.error.issues.map((issue) => issue.message).join('; ')
      throw new Error(`无效 Manifest: ${manifestPath} — ${detail}`)
    }

    discovered.push({
      dir,
      manifestPath,
      manifest: parsed.data
    })
  }

  return discovered
}
