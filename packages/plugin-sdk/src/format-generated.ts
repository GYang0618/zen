import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { findMonorepoRoot } from './discover.js'

export function formatGeneratedSource(source: string, filename: string): string {
  const root = findMonorepoRoot()
  const require = createRequire(join(root, 'package.json'))
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('@biomejs/biome/bin/biome'),
      'check',
      '--write',
      `--stdin-file-path=${filename}`
    ],
    { cwd: root, input: source, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }
  )
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Cannot format generated ${filename}: ${result.stderr}`)
  return result.stdout
}
