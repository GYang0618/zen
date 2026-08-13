#!/usr/bin/env node
/**
 * 静态门禁：plugins 下所有 *.controller.ts 必须出现 RequirePlugin。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const pluginsRoot = join(process.cwd(), 'plugins')
if (!existsSync(pluginsRoot)) {
  console.log('无 plugins 目录，跳过')
  process.exit(0)
}

const missing = []

for (const name of readdirSync(pluginsRoot, { withFileTypes: true })) {
  if (!name.isDirectory()) continue
  const apiDir = join(pluginsRoot, name.name, 'src', 'api')
  if (!existsSync(apiDir)) continue

  const controllers = readdirSync(apiDir).filter((file) => file.endsWith('.controller.ts'))
  for (const file of controllers) {
    const content = readFileSync(join(apiDir, file), 'utf8')
    if (!content.includes('RequirePlugin')) {
      missing.push(`${name.name}/src/api/${file}`)
    }
  }
}

if (missing.length > 0) {
  console.error('以下 Controller 缺少 RequirePlugin：')
  for (const item of missing) {
    console.error(`  - ${item}`)
  }
  process.exit(1)
}

console.log('Plugin guard check passed')
