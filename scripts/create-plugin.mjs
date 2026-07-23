#!/usr/bin/env node
/**
 * PLG-06 最小脚手架：生成 plugins/<id> 目录骨架。
 * 用法: node scripts/create-plugin.mjs my-plugin "我的插件"
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const id = process.argv[2]
const name = process.argv[3] || id

if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error('用法: node scripts/create-plugin.mjs <plugin-id> [显示名]')
  console.error('plugin-id 须为 kebab-case，例如 demo-notes')
  process.exit(1)
}

const root = path.resolve(process.cwd(), 'plugins', id)
if (existsSync(root)) {
  console.error(`目录已存在: ${root}`)
  process.exit(1)
}

mkdirSync(path.join(root, 'src'), { recursive: true })

writeFileSync(
  path.join(root, 'zen.plugin.json'),
  JSON.stringify(
    {
      id,
      name,
      version: '0.1.0',
      platformVersion: '^0.1.0',
      dependsOn: [],
      contributions: {
        permissions: []
      }
    },
    null,
    2
  ) + '\n'
)

writeFileSync(
  path.join(root, 'package.json'),
  JSON.stringify(
    {
      name: `@zen/plugin-${id}`,
      version: '0.1.0',
      private: true,
      main: './src/index.ts',
      dependencies: {
        '@zen/plugin-sdk': 'workspace:*'
      }
    },
    null,
    2
  ) + '\n'
)

writeFileSync(
  path.join(root, 'src/index.ts'),
  `export const PLUGIN_ID = '${id}'\n`
)

writeFileSync(path.join(root, 'README.md'), `# ${name}\n\n由 \`create-plugin\` 生成的插件骨架。\n`)

console.log(`已创建插件骨架: plugins/${id}`)
console.log('下一步: pnpm plugin:validate && pnpm plugin:generate')
