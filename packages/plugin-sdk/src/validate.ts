import { existsSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

import {
  ALLOWED_PLUGIN_ICON_SET,
  ALLOWED_PLUGIN_ICONS,
  KERNEL_PERMISSION_PREFIX,
  PLATFORM_VERSION,
  PLUGIN_ENTRY_EXTENSIONS
} from './constants'
import { discoverPlugins, findMonorepoRoot } from './discover'
import { zenPluginManifestSchema } from './manifest.schema'
import { topologicalSort } from './topo-sort'

import type { ZenPluginManifest } from './manifest.schema'
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

function hasKnownExtension(entryPath: string): boolean {
  return PLUGIN_ENTRY_EXTENSIONS.some((ext) => entryPath.endsWith(ext))
}

function isPathInsidePluginDir(pluginDir: string, candidate: string): boolean {
  const rel = relative(resolve(pluginDir), resolve(candidate))
  if (rel === '') return true
  return !rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel)
}

/**
 * 解析插件入口：存在、不逃逸插件目录；尝试 `.ts`/`.tsx`/`.js`/`.jsx` 与 `index`。
 */
export function resolvePluginEntry(
  pluginDir: string,
  entryPath: string
): { ok: true; resolved: string } | { ok: false; message: string } {
  const pluginRoot = resolve(pluginDir)
  const base = resolve(pluginRoot, entryPath)

  const candidates: string[] = []
  if (hasKnownExtension(entryPath)) {
    candidates.push(base)
  } else {
    candidates.push(base)
    for (const ext of PLUGIN_ENTRY_EXTENSIONS) {
      candidates.push(`${base}${ext}`)
      candidates.push(join(base, `index${ext}`))
    }
  }

  let escapeDetected = false
  for (const candidate of candidates) {
    if (!isPathInsidePluginDir(pluginRoot, candidate)) {
      escapeDetected = true
      continue
    }
    if (existsSync(candidate)) {
      const stat = statSync(candidate)
      if (stat.isFile()) {
        return { ok: true, resolved: candidate }
      }
    }
  }

  if (escapeDetected && !candidates.some((c) => isPathInsidePluginDir(pluginRoot, c))) {
    return { ok: false, message: `入口路径逃逸插件目录: ${entryPath}` }
  }
  if (escapeDetected) {
    return { ok: false, message: `入口路径逃逸插件目录: ${entryPath}` }
  }
  return { ok: false, message: `入口文件不存在: ${entryPath}` }
}

function collectEntryPaths(manifest: ZenPluginManifest): Array<{ label: string; entry: string }> {
  const entries: Array<{ label: string; entry: string }> = []
  if (manifest.api) {
    entries.push({ label: 'api.entry', entry: manifest.api.entry })
  }
  for (const route of manifest.routes) {
    entries.push({ label: `routes[${route.id}].entry`, entry: route.entry })
  }
  if (manifest.config) {
    entries.push({ label: 'config.entry', entry: manifest.config.entry })
  }
  if (manifest.lifecycle) {
    entries.push({ label: 'lifecycle.entry', entry: manifest.lifecycle.entry })
  }
  for (const widget of manifest.widgets ?? []) {
    entries.push({ label: `widgets[${widget.id}].entry`, entry: widget.entry })
  }
  if (manifest.agentTools) {
    entries.push({ label: 'agentTools.entry', entry: manifest.agentTools.entry })
  }
  return entries
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

  for (const permission of manifest.permissions) {
    if (permission.code.startsWith(KERNEL_PERMISSION_PREFIX)) {
      issues.push({
        level: 'error',
        pluginId: manifest.id,
        message: `权限码 ${permission.code} 使用了内核保留前缀 ${KERNEL_PERMISSION_PREFIX}`
      })
    }
  }

  const declaredPermissionCodes = new Set(manifest.permissions.map((p) => p.code))

  for (const route of manifest.routes) {
    if (!ALLOWED_PLUGIN_ICON_SET.has(route.icon)) {
      issues.push({
        level: 'error',
        pluginId: manifest.id,
        message: `未知 icon "${route.icon}"；允许: ${ALLOWED_PLUGIN_ICONS.join(', ')}`
      })
    }
    for (const code of route.permissions ?? []) {
      if (!declaredPermissionCodes.has(code)) {
        issues.push({
          level: 'error',
          pluginId: manifest.id,
          message: `route "${route.id}" 权限 ${code} 未在本插件 permissions 中声明`
        })
      }
    }
  }

  for (const widget of manifest.widgets ?? []) {
    for (const code of widget.permissions ?? []) {
      if (!declaredPermissionCodes.has(code)) {
        issues.push({
          level: 'error',
          pluginId: manifest.id,
          message: `widget "${widget.id}" 权限 ${code} 未在本插件 permissions 中声明`
        })
      }
    }
  }

  return issues
}

function validatePackageName(plugin: DiscoveredPlugin): ValidationIssue[] {
  const pkgPath = join(plugin.dir, 'package.json')
  const expected = `@zen/plugin-${plugin.manifest.id}`
  if (!existsSync(pkgPath)) {
    return [
      {
        level: 'error',
        pluginId: plugin.manifest.id,
        message: `缺少 package.json（期望 name=${expected}）`
      }
    ]
  }

  try {
    const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: unknown }
    if (raw.name !== expected) {
      return [
        {
          level: 'error',
          pluginId: plugin.manifest.id,
          message: `package.json name 应为 ${expected}，实际为 ${String(raw.name)}`
        }
      ]
    }
  } catch (error) {
    return [
      {
        level: 'error',
        pluginId: plugin.manifest.id,
        message: `无法解析 package.json: ${error instanceof Error ? error.message : String(error)}`
      }
    ]
  }

  return []
}

function validateEntries(plugin: DiscoveredPlugin): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const { label, entry } of collectEntryPaths(plugin.manifest)) {
    const result = resolvePluginEntry(plugin.dir, entry)
    if (!result.ok) {
      issues.push({
        level: 'error',
        pluginId: plugin.manifest.id,
        message: `${label}: ${result.message}`
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

    const dirName = plugin.dir.split(/[/\\]/).pop()
    if (plugin.manifest.id !== dirName) {
      issues.push({
        level: 'error',
        pluginId: plugin.manifest.id,
        message: `目录名与 Manifest.id 不一致（目录=${dirName}）`
      })
    }

    issues.push(...validatePackageName(plugin))
    issues.push(...validateEntries(plugin))
  }

  const permissionOwners = new Map<string, string>()
  for (const plugin of plugins) {
    for (const permission of plugin.manifest.permissions) {
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

  const routePathOwners = new Map<string, string>()
  const routeIdOwners = new Map<string, string>()
  for (const plugin of plugins) {
    for (const route of plugin.manifest.routes) {
      const pathOwner = routePathOwners.get(route.path)
      if (pathOwner) {
        issues.push({
          level: 'error',
          pluginId: plugin.manifest.id,
          message: `route.path 全局冲突: ${route.path} 已被 ${pathOwner} 使用`
        })
      } else {
        routePathOwners.set(route.path, plugin.manifest.id)
      }

      const idOwner = routeIdOwners.get(route.id)
      if (idOwner) {
        issues.push({
          level: 'error',
          pluginId: plugin.manifest.id,
          message: `route.id 全局冲突: ${route.id} 已被 ${idOwner} 使用`
        })
      } else {
        routeIdOwners.set(route.id, plugin.manifest.id)
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
