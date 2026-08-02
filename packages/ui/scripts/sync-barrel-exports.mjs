/**
 * 扫描 packages/ui/src 下的 components / common / hooks / lib，重写 src/index.ts 的 export * 语句。
 *
 * 用法：
 *   node scripts/sync-barrel-exports.mjs
 *   node scripts/sync-barrel-exports.mjs --watch
 *
 * 分区约定：
 *   - components → shadcn / registry
 *   - common     → 自研通用组件（新增文件会自动进 barrel）
 *   - hooks / lib
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
  { dir: 'components', label: 'Components (shadcn)' },
  { dir: 'common', label: 'Common (自研)' },
  { dir: 'hooks', label: 'Hooks' },
  { dir: 'lib', label: 'Lib' }
]

/** @param {string} filePath */
function shouldSkipFile(filePath) {
  const base = path.basename(filePath)
  const name = base.replace(/\.tsx?$/, '')
  // 测试 / 声明
  if (name.endsWith('.test') || name.endsWith('.spec')) return true
  if (name.endsWith('.d')) return true
  if (filePath.includes(`${path.sep}__tests__${path.sep}`)) return true
  // 草稿 / 备份（如 Finder「xxx copy.tsx」），避免污染 barrel
  if (base.startsWith('.')) return true
  if (/\s/.test(base)) return true
  if (/\.(bak|old|tmp|orig)$/i.test(base)) return true
  if (/(?:^|[.\s_-])(?:copy|backup|草稿)(?:[.\s_-]|$)/i.test(name)) return true
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
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return files
    }
    throw err
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

/** 确保分区目录存在，避免新增 common 等目录前脚本/监听失败 */
async function ensureSectionDirs() {
  await fs.mkdir(SRC_DIR, { recursive: true })
  for (const { dir } of SECTIONS) {
    await fs.mkdir(path.join(SRC_DIR, dir), { recursive: true })
  }
}

async function generateBarrelContent() {
  /** @type {string[]} */
  const lines = []
  /** @type {string[]} */
  const summary = []

  for (let i = 0; i < SECTIONS.length; i++) {
    const { dir, label } = SECTIONS[i]
    const sectionRoot = path.join(SRC_DIR, dir)
    const tsFiles = await collectTsFiles(sectionRoot)
    const exports = [...new Set(tsFiles.map(exportPathFromFile))].sort((a, b) =>
      a.localeCompare(b, 'en')
    )

    summary.push(`${dir}:${exports.length}`)

    if (i > 0) lines.push('')
    lines.push(`// ${label}`)
    lines.push('')

    if (exports.length === 0) {
      lines.push(`// (empty)`)
      continue
    }

    for (const exp of exports) {
      lines.push(`export * from '${exp}'`)
    }
  }

  return {
    content: `${lines.join('\n')}\n`,
    summary: summary.join(', ')
  }
}

async function writeIndexIfChanged() {
  const { content: next, summary } = await generateBarrelContent()
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
  console.log(
    `[sync-barrel-exports] 已更新 ${path.relative(PACKAGE_ROOT, INDEX_FILE)} (${summary})`
  )
  return true
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let debounceTimer

function scheduleWrite(reason = '') {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    writeIndexIfChanged()
      .then((changed) => {
        if (!changed && reason) {
          // 安静跳过；需要排查时可打开
        }
      })
      .catch((err) => {
        console.error('[sync-barrel-exports]', err)
        process.exitCode = 1
      })
  }, 150)
}

/**
 * 分别监听各分区目录。macOS 上对「新建子目录」的 recursive watch 不稳定，
 * 按分区根目录监听更可靠；同时监听 src 根以捕获新建分区文件夹。
 */
function watchSrc() {
  if (!fsSync.watch) {
    console.error('[sync-barrel-exports] 当前环境不支持 fs.watch')
    process.exit(1)
  }

  /** @type {Map<string, fsSync.FSWatcher>} */
  const watchers = new Map()

  /** @param {string} dir */
  function startWatch(dir) {
    const key = path.resolve(dir)
    if (watchers.has(key)) return

    try {
      const watcher = fsSync.watch(dir, { recursive: true }, (_event, filename) => {
        if (!filename) {
          scheduleWrite('dir-event')
          return
        }
        const normalized = filename.replace(/\\/g, '/')
        if (normalized === 'index.ts' || normalized.endsWith('/index.ts')) return
        // 新建目录时补挂监听
        const abs = path.join(dir, filename)
        try {
          if (fsSync.existsSync(abs) && fsSync.statSync(abs).isDirectory()) {
            startWatch(abs)
          }
        } catch {
          // 删除事件下路径可能已不存在
        }
        scheduleWrite(normalized)
      })
      watcher.on('error', (err) => {
        console.error(`[sync-barrel-exports] watch 错误 (${dir}):`, err)
      })
      watchers.set(key, watcher)
    } catch (err) {
      console.error(`[sync-barrel-exports] 无法监听 ${dir}:`, err)
    }
  }

  startWatch(SRC_DIR)
  for (const { dir } of SECTIONS) {
    startWatch(path.join(SRC_DIR, dir))
  }

  console.log(`[sync-barrel-exports] 监听中: ${SECTIONS.map((s) => s.dir).join(', ')} @ ${SRC_DIR}`)
  console.log(
    '[sync-barrel-exports] 修改本脚本后必须重启 watch，否则仍会按旧 SECTIONS 覆盖 index.ts'
  )
}

const watch = process.argv.includes('--watch')

ensureSectionDirs()
  .then(() => writeIndexIfChanged())
  .then(() => {
    if (watch) watchSrc()
  })
  .catch((err) => {
    console.error('[sync-barrel-exports]', err)
    process.exit(1)
  })
