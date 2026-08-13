#!/usr/bin/env node
/**
 * 扫描 NestJS controller：写接口（POST/PUT/PATCH/DELETE）必须具备
 * @RequirePermission / @Public / @AllowAuthenticated 之一（方法级或类级）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const controllersDir = path.join(root, 'apps/api/src')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith('.controller.ts')) out.push(full)
  }
  return out
}

const WRITE_DECORATORS = ['@Post', '@Put', '@Patch', '@Delete']
const ALLOW_DECORATORS = ['@RequirePermission', '@Public', '@AllowAuthenticated']

function getClassLevelAllows(source) {
  const classMatch = source.match(/((?:@[A-Za-z][A-Za-z0-9_]*\([^\n]*\)\s*)+)@Controller\(/)
  if (!classMatch) return false
  return ALLOW_DECORATORS.some((d) => classMatch[1].includes(d))
}

function findUnguardedWrites(source, file) {
  const findings = []
  const classAllowed = getClassLevelAllows(source)
  const lines = source.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const write = WRITE_DECORATORS.find((d) => line.startsWith(`${d}(`) || line === d)
    if (!write) continue

    // 向上收集连续装饰器
    let j = i - 1
    const decorators = [line]
    while (j >= 0) {
      const prev = lines[j].trim()
      if (prev === '' || prev.startsWith('//') || prev.startsWith('/*') || prev.startsWith('*')) {
        j -= 1
        continue
      }
      if (prev.startsWith('@')) {
        decorators.unshift(prev)
        j -= 1
        continue
      }
      break
    }

    // 向下到方法签名前
    let k = i + 1
    while (k < lines.length) {
      const next = lines[k].trim()
      if (next === '' || next.startsWith('//')) {
        k += 1
        continue
      }
      if (next.startsWith('@')) {
        decorators.push(next)
        k += 1
        continue
      }
      break
    }

    const joined = decorators.join('\n')
    const methodAllowed = ALLOW_DECORATORS.some((d) => joined.includes(d))
    if (methodAllowed || classAllowed) continue

    let methodName = '(unknown)'
    for (let m = i; m < Math.min(i + 16, lines.length); m++) {
      const trimmed = lines[m].trim()
      if (trimmed.startsWith('@')) continue
      const methodMatch = trimmed.match(/^(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/)
      if (methodMatch) {
        methodName = methodMatch[1]
        break
      }
    }

    findings.push({
      file: path.relative(root, file),
      line: i + 1,
      decorator: write,
      method: methodName
    })
  }

  return findings
}

const files = walk(controllersDir)
const all = files.flatMap((file) => findUnguardedWrites(fs.readFileSync(file, 'utf8'), file))

if (all.length > 0) {
  console.error('❌ 发现未声明权限的写接口：')
  for (const item of all) {
    console.error(`  - ${item.decorator} ${item.method} @ ${item.file}:${item.line}`)
  }
  process.exit(1)
}

console.log(`✅ 写接口权限装饰器扫描通过（${files.length} 个 controller）`)
