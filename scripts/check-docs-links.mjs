import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_DIR = join(ROOT, 'docs')

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function extractRelativeLinks(markdown) {
  const links = []
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g
  let match = pattern.exec(markdown)

  while (match) {
    links.push(match[1])
    match = pattern.exec(markdown)
  }

  return links
}

const failures = []
const files = await collectMarkdownFiles(DOCS_DIR)

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const links = extractRelativeLinks(content)

  for (const target of links) {
    if (/^(https?:|mailto:|#)/.test(target)) {
      continue
    }

    const pathOnly = target.split('#')[0]
    if (!pathOnly) {
      continue
    }

    const resolved = resolve(dirname(file), pathOnly)
    if (!existsSync(resolved)) {
      failures.push(`${file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '')} -> ${target}`)
    }
  }
}

if (failures.length > 0) {
  console.error('Docs link check failed:')
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exit(1)
}

console.log(`Docs link check passed (${files.length} files).`)
