#!/usr/bin/env node
/**
 * 扫描前端 staticData / Can / 后端 RequirePermission 中的权限字面量，
 * 确保均存在于：各模块 permissions.ts（内核）与 plugins 下的 zen.plugin.json（插件）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.'))
      continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, exts, out)
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full)
  }
  return out
}

function loadKernelCodes() {
  const files = walk(path.join(root, 'packages/shared/src/domains'), ['.ts']).filter((file) =>
    file.endsWith(`${path.sep}permissions.ts`)
  )
  const codes = new Set()
  const codeKeyMap = new Map()

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    const blocks = source.split('defineKernelPermissions')
    for (const block of blocks.slice(1)) {
      const ns = block.match(/namespace:\s*['"]([^'"]+)['"]/)
      const resource = block.match(/resource:\s*['"]([^'"]+)['"]/)
      if (!ns || !resource) continue
      const actionRe = /action:\s*['"]([^'"]+)['"]/g
      let match = actionRe.exec(block)
      while (match) {
        const code = `${ns[1]}:${resource[1]}:${match[1]}`
        codes.add(code)
        const key = `${resource[1]}_${match[1]}`.toUpperCase().replace(/-/g, '_')
        codeKeyMap.set(key, code)
        match = actionRe.exec(block)
      }
    }
  }

  if (codes.size === 0) {
    throw new Error('未能从 domains/**/permissions.ts 解析到任何内核权限码')
  }
  return { codes, codeKeyMap }
}

function loadPluginCodes() {
  const codes = new Set()
  const pluginsDir = path.join(root, 'plugins')
  if (!fs.existsSync(pluginsDir)) return codes

  for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(pluginsDir, entry.name, 'zen.plugin.json')
    if (!fs.existsSync(manifestPath)) continue
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const permissions = manifest.permissions ?? manifest.contributions?.permissions ?? []
    for (const permission of permissions) {
      if (permission.code) codes.add(permission.code)
    }
  }
  return codes
}

function collectUsedCodes(files) {
  const used = []
  const patterns = [
    /permissions\s*:\s*\[\s*([^\]]+)\]/g,
    /permission=\{?\s*['"]([a-z0-9_:-]+)['"]/g,
    /permission=\{\s*\[\s*([^\]]+)\]\s*\}/g,
    /RequirePermission\(\s*['"]([a-z0-9_:-]+)['"]/g
  ]

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const rel = path.relative(root, file)

    for (const re of patterns) {
      re.lastIndex = 0
      let match = re.exec(text)
      while (match) {
        const chunk = match[1]
        if (!chunk) {
          match = re.exec(text)
          continue
        }
        if (chunk.includes('PermissionCode')) {
          match = re.exec(text)
          continue
        }
        const literals = chunk.match(/['"]([a-z][a-z0-9_-]*:[a-z0-9_:-]+)['"]/g) ?? [
          chunk.includes(':') ? `'${chunk}'` : null
        ]
        for (const lit of literals) {
          if (!lit) continue
          const code = lit.replace(/['"]/g, '')
          if (/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/.test(code)) {
            used.push({ code, file: rel })
          }
        }
        match = re.exec(text)
      }
    }

    const codeRefRe = /PermissionCode\.([A-Z0-9_]+)/g
    let ref = codeRefRe.exec(text)
    while (ref) {
      used.push({ code: `PermissionCode.${ref[1]}`, file: rel, isRef: true, key: ref[1] })
      ref = codeRefRe.exec(text)
    }
  }
  return used
}

const kernel = loadKernelCodes()
const pluginCodes = loadPluginCodes()
const catalog = new Set([...kernel.codes, ...pluginCodes])

const scanRoots = [
  path.join(root, 'apps/web/src'),
  path.join(root, 'apps/api/src'),
  path.join(root, 'plugins')
]

const files = scanRoots.flatMap((dir) => walk(dir, ['.ts', '.tsx']))
const used = collectUsedCodes(files)

const unknown = []
for (const item of used) {
  if (item.isRef) {
    const resolved = kernel.codeKeyMap.get(item.key)
    if (!resolved) {
      unknown.push({ ...item, code: item.code, reason: 'PermissionCode 键不存在' })
      continue
    }
    if (!catalog.has(resolved)) {
      unknown.push({ ...item, code: resolved, reason: '目录中不存在' })
    }
    continue
  }
  if (!catalog.has(item.code)) {
    unknown.push({ ...item, reason: '目录中不存在' })
  }
}

const unique = []
const seen = new Set()
for (const item of unknown) {
  const key = `${item.file}:${item.code}`
  if (seen.has(key)) continue
  seen.add(key)
  unique.push(item)
}

if (unique.length > 0) {
  console.error('❌ 发现未知权限码（不在模块目录或插件 manifest）：')
  for (const item of unique) {
    console.error(`  - ${item.code} @ ${item.file} (${item.reason})`)
  }
  process.exit(1)
}

console.log(
  `✅ 权限码扫描通过（内核 ${kernel.codes.size} + 插件 ${pluginCodes.size}，扫描文件 ${files.length}）`
)
