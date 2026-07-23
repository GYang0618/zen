import { KERNEL_PERMISSION_PREFIX, PLATFORM_VERSION } from './constants'
import { discoverPlugins, findMonorepoRoot } from './discover'
import { zenPluginManifestSchema } from './manifest.schema'
import { topologicalSort } from './topo-sort'

import type { DiscoveredPlugin, ValidationIssue, ValidationResult } from './types'

/**
 * 简易 semver range：支持 `*`、精确版本、`^x.y.z`（major 相同且 >=）。
 */
export function isPlatformCompatible(range: string, platformVersion = PLATFORM_VERSION): boolean {
  const trimmed = range.trim()
  if (trimmed === '*' || trimmed === platformVersion) return true

  const caret = trimmed.match(/^\^(\d+)\.(\d+)\.(\d+)$/)
  const platform = platformVersion.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!caret || !platform) return false

  const [, rMaj, rMin, rPatch] = caret.map(Number) as [string, number, number, number]
  const [, pMaj, pMin, pPatch] = platform.map(Number) as [string, number, number, number]
  if (pMaj !== rMaj) return false
  if (pMin > rMin) return true
  if (pMin < rMin) return false
  return pPatch >= rPatch
}

export function validateManifestObject(raw: unknown): ValidationIssue[] {
  const parsed = zenPluginManifestSchema.safeParse(raw)
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      level: 'error' as const,
      message: `${issue.path.join('.')}: ${issue.message}`
    }))
  }

  const issues: ValidationIssue[] = []
  const manifest = parsed.data

  if (!isPlatformCompatible(manifest.platformVersion)) {
    issues.push({
      level: 'error',
      pluginId: manifest.id,
      message: `platformVersion ${manifest.platformVersion} 与平台 ${PLATFORM_VERSION} 不兼容`
    })
  }

  for (const permission of manifest.contributions.permissions) {
    if (permission.code.startsWith(KERNEL_PERMISSION_PREFIX)) {
      issues.push({
        level: 'error',
        pluginId: manifest.id,
        message: `权限码 ${permission.code} 使用了内核保留前缀 ${KERNEL_PERMISSION_PREFIX}`
      })
    }
  }

  return issues
}

export function validatePlugins(rootDir?: string): ValidationResult {
  const root = rootDir ?? findMonorepoRoot()
  const issues: ValidationIssue[] = []
  let plugins: DiscoveredPlugin[] = []

  try {
    plugins = discoverPlugins(root)
  } catch (error) {
    issues.push({
      level: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
    return { ok: false, issues, plugins: [], order: [] }
  }

  const ids = new Set<string>()
  for (const plugin of plugins) {
    if (ids.has(plugin.manifest.id)) {
      issues.push({
        level: 'error',
        pluginId: plugin.manifest.id,
        message: `插件 id 重复: ${plugin.manifest.id}`
      })
    }
    ids.add(plugin.manifest.id)

    for (const issue of validateManifestObject(plugin.manifest)) {
      issues.push({ ...issue, pluginId: plugin.manifest.id })
    }

    if (plugin.manifest.id !== plugin.dir.split(/[/\\]/).pop()) {
      issues.push({
        level: 'warning',
        pluginId: plugin.manifest.id,
        message: `目录名与 Manifest.id 不一致（目录=${plugin.dir.split(/[/\\]/).pop()}）`
      })
    }
  }

  const permissionOwners = new Map<string, string>()
  for (const plugin of plugins) {
    for (const permission of plugin.manifest.contributions.permissions) {
      const owner = permissionOwners.get(permission.code)
      if (owner && owner !== plugin.manifest.id) {
        issues.push({
          level: 'error',
          pluginId: plugin.manifest.id,
          message: `权限码冲突: ${permission.code} 已被 ${owner} 声明`
        })
      } else {
        permissionOwners.set(permission.code, plugin.manifest.id)
      }
    }
  }

  let order: string[] = []
  try {
    order = topologicalSort(
      plugins.map((plugin) => ({
        id: plugin.manifest.id,
        dependsOn: plugin.manifest.dependsOn
      }))
    )
  } catch (error) {
    issues.push({
      level: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  }

  const knownIds = new Set(plugins.map((plugin) => plugin.manifest.id))
  for (const plugin of plugins) {
    for (const dep of plugin.manifest.dependsOn) {
      if (!knownIds.has(dep)) {
        issues.push({
          level: 'error',
          pluginId: plugin.manifest.id,
          message: `dependsOn 引用了未知插件: ${dep}`
        })
      }
    }
  }

  const ok = issues.every((issue) => issue.level !== 'error')
  return { ok, issues, plugins, order }
}
