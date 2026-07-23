#!/usr/bin/env node
import { generatePluginRegistry } from './generate-registry'
import { validatePlugins } from './validate'

function printHelp() {
  console.log(`Usage: zen-plugin <command>

Commands:
  validate   扫描 plugins/* 并校验 Manifest / 依赖 / 权限冲突
  generate   校验通过后生成 plugin-registry.gen.ts
  help       显示帮助
`)
}

function main(argv: string[]) {
  const command = argv[2] ?? 'help'

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'validate') {
    const result = validatePlugins()
    for (const issue of result.issues) {
      const prefix = issue.level === 'error' ? 'ERROR' : 'WARN'
      const plugin = issue.pluginId ? `[${issue.pluginId}] ` : ''
      console.error(`${prefix}: ${plugin}${issue.message}`)
    }
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
    const result = validatePlugins()
    for (const issue of result.issues) {
      const prefix = issue.level === 'error' ? 'ERROR' : 'WARN'
      const plugin = issue.pluginId ? `[${issue.pluginId}] ` : ''
      console.error(`${prefix}: ${plugin}${issue.message}`)
    }
    if (!result.ok) {
      process.exitCode = 1
      return
    }
    const generated = generatePluginRegistry()
    console.log(`已生成注册表: ${generated.outFile} (${generated.count} plugins)`)
    return
  }

  console.error(`未知命令: ${command}`)
  printHelp()
  process.exitCode = 1
}

main(process.argv)
