#!/usr/bin/env node

import { generatePluginRegistry } from './generate-registry.js'
import { validatePlugins } from './validate.js'

function printHelp() {
  console.log(`Usage: zen-plugin <command>

Commands:
  validate          扫描 plugins/* 并校验 Manifest / 入口 / 依赖 / 权限冲突
  generate          校验通过后生成 plugin-registry.gen.ts
  generate --check  校验生成结果与现有文件一致（不写盘）
  help              显示帮助
`)
}

function printIssues(issues: Array<{ level: string; pluginId?: string; message: string }>): void {
  for (const issue of issues) {
    const prefix = issue.level === 'error' ? 'ERROR' : 'WARN'
    const plugin = issue.pluginId ? `[${issue.pluginId}] ` : ''
    console.error(`${prefix}: ${plugin}${issue.message}`)
  }
}

function main(argv: string[]) {
  const command = argv[2] ?? 'help'

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'validate') {
    const result = validatePlugins()
    printIssues(result.issues)
    if (!result.ok) {
      console.error(`校验失败：${result.issues.filter((i) => i.level === 'error').length} 个错误`)
      process.exitCode = 1
      return
    }
    console.log(
      `校验通过：${result.plugins.length} 个插件，拓扑序: ${result.order.join(' -> ') || '(空)'}`
    )
    return
  }

  if (command === 'generate') {
    const check = argv.includes('--check')
    const result = validatePlugins()
    printIssues(result.issues)
    if (!result.ok) {
      process.exitCode = 1
      return
    }
    try {
      const generated = generatePluginRegistry({ check })
      if (check) {
        console.log(`注册表检查通过: ${generated.outFile} (${generated.count} plugins)`)
        console.log(`Loader 检查通过: ${generated.loaderFiles.length} files`)
        console.log(`Host 检查通过: ${generated.hostFiles.length} files`)
      } else {
        console.log(`已生成注册表: ${generated.outFile} (${generated.count} plugins)`)
        console.log(`已生成 loaders:\n${generated.loaderFiles.map((f) => `  - ${f}`).join('\n')}`)
        console.log(`已生成 host 文件:\n${generated.hostFiles.map((f) => `  - ${f}`).join('\n')}`)
        if (generated.prunedRoutes.length > 0) {
          console.log(
            `已清理陈旧路由:\n${generated.prunedRoutes.map((f) => `  - ${f}`).join('\n')}`
          )
        }
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
    return
  }

  console.error(`未知命令: ${command}`)
  printHelp()
  process.exitCode = 1
}

main(process.argv)
