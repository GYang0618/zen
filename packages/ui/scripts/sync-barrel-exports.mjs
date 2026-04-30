/**
 * 扫描 packages/ui/src 下的 components / hooks / lib，重写 src/index.ts 的 export * 语句。
 * 用法：node scripts/sync-barrel-exports.mjs [--watch]
 */

import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(PACKAGE_ROOT, 'src')
const INDEX_FILE = path.join(SRC_DIR, 'index.ts')

const SECTIONS = [
  { dir: 'components', label: 'Components' },
  { dir: 'hooks', label: 'Hooks' },
  { dir: 'lib', label: 'Lib' }
]

/** @param {string} filePath */
function shouldSkipFile(filePath) {
  const base = path.basename(filePath)
  const name = base.replace(/\.tsx?$/, '')
  if (name.endsWith('.test') || name.endsWith('.spec')) return true
  if (filePath.includes(`${path.sep}__tests__${path.sep}`)) return true
  return false
}

/** @param {string} fullPath */
function exportPathFromFile(fullPath) {
  const rel = path.relative(SRC_DIR, fullPath).replace(/\\/g, '/')
  const withoutExt = rel.replace(/\.tsx?$/, '')
  const parts = withoutExt.split('/')
  const last = parts[parts.length - 1]
  if (last === 'index') {
    return `./${parts.slice(0, -1).join('/')}`
  }
  return `./${withoutExt}`
}

/** @param {string} dir */
async function collectTsFiles(dir) {
  /** @type {string[]} */
  const files = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      files.push(...(await collectTsFiles(full)))
      continue
    }
    if (!ent.isFile()) continue
    const ext = path.extname(ent.name)
    if (ext !== '.tsx' && ext !== '.ts') continue
    if (shouldSkipFile(full)) continue
    files.push(full)
  }
  return files
}

async function generateBarrelContent() {
  /** @type {string[]} */
  const lines = []

  for (let i = 0; i < SECTIONS.length; i++) {
    const { dir, label } = SECTIONS[i]
    if (i > 0) lines.push('')
    lines.push(`// ${label}`)
    lines.push('')

    const sectionRoot = path.join(SRC_DIR, dir)
    const tsFiles = await collectTsFiles(sectionRoot)
    const exports = [...new Set(tsFiles.map(exportPathFromFile))].sort((a, b) =>
      a.localeCompare(b, 'en')
    )
    for (const exp of exports) {
      lines.push(`export * from '${exp}'`)
    }
  }

  return `${lines.join('\n')}\n`
}

async function writeIndexIfChanged() {
  const next = await generateBarrelContent()
  let prev = ''
  try {
    prev = await fs.readFile(INDEX_FILE, 'utf8')
  } catch {
    prev = ''
  }
  if (prev === next) {
    return false
  }
  await fs.writeFile(INDEX_FILE, next, 'utf8')
  console.log(`[sync-barrel-exports] 已更新 ${path.relative(PACKAGE_ROOT, INDEX_FILE)}`)
  return true
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let debounceTimer

function scheduleWrite() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    writeIndexIfChanged().catch((err) => {
      console.error('[sync-barrel-exports]', err)
      process.exitCode = 1
    })
  }, 150)
}

function watchSrc() {
  if (!fsSync.watch) {
    console.error('[sync-barrel-exports] 当前环境不支持 fs.watch')
    process.exit(1)
  }
  try {
    fsSync.watch(SRC_DIR, { recursive: true }, (_event, filename) => {
      if (!filename) return
      const normalized = filename.replace(/\\/g, '/')
      // 忽略 barrel 自身写入，避免无意义重复生成
      if (normalized === 'index.ts') return

      scheduleWrite()
    })
  } catch (err) {
    console.error('[sync-barrel-exports] watch 启动失败:', err)
    process.exit(1)
  }
  console.log(`[sync-barrel-exports] 监听中: ${SRC_DIR}`)
}

const watch = process.argv.includes('--watch')

writeIndexIfChanged()
  .then(() => {
    if (watch) watchSrc()
  })
  .catch((err) => {
    console.error('[sync-barrel-exports]', err)
    process.exit(1)
  })
