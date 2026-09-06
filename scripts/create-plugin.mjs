#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
/**
 * 插件脚手架：生成 plugins/<id> 完整最小切片。
 * 用法:
 *   node scripts/create-plugin.mjs <id> [显示名] [--with-api] [--with-web]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const flags = new Set(args.filter((arg) => arg.startsWith('--')))
const positional = args.filter((arg) => !arg.startsWith('--'))
const id = positional[0]
const name = positional[1] || id
const withApi = flags.has('--with-api') || flags.has('--with-web') || flags.size === 0
const withWeb = flags.has('--with-web') || flags.size === 0

if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error(
    '用法: node scripts/create-plugin.mjs <plugin-id> [显示名] [--with-api] [--with-web]'
  )
  console.error('plugin-id 须为 kebab-case，例如 demo-notes')
  process.exit(1)
}

const root = path.resolve(process.cwd(), 'plugins', id)
if (existsSync(root)) {
  console.error(`目录已存在: ${root}`)
  process.exit(1)
}

const moduleName = id
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')
const permissionModule = id.split('-')[0] ?? id
const listPermission = `${permissionModule}:item:list`
const managePermission = `${permissionModule}:item:manage`
const segment = id
const pluginConst = `${id.replaceAll('-', '_').toUpperCase()}_PLUGIN_ID`

mkdirSync(path.join(root, 'src'), { recursive: true })
if (withApi) {
  mkdirSync(path.join(root, 'src/api'), { recursive: true })
}
if (withWeb) {
  mkdirSync(path.join(root, 'src/web/pages'), { recursive: true })
}
mkdirSync(path.join(root, 'tests'), { recursive: true })

const manifest = {
  id,
  name,
  version: '0.1.0',
  platformVersion: '^0.1.0',
  dependsOn: [],
  permissions: [
    {
      code: listPermission,
      name: `查看${name}`,
      module: permissionModule,
      description: `查看 ${name} 列表`
    },
    {
      code: managePermission,
      name: `管理${name}`,
      module: permissionModule,
      description: `管理 ${name}`
    }
  ],
  routes: withWeb
    ? [
        {
          id: `${id}-home`,
          path: `/plugins/${segment}`,
          entry: './src/web/pages/page',
          componentExport: `${moduleName}Page`,
          title: name,
          icon: 'briefcase',
          order: 200,
          permissions: [listPermission]
        }
      ]
    : [],
  ...(withApi
    ? {
        api: {
          entry: `./src/api/${id}.module`,
          export: `${moduleName}Module`
        }
      }
    : {}),
  lifecycle: {
    entry: './src/lifecycle.ts',
    export: 'lifecycle'
  }
}

writeFileSync(path.join(root, 'zen.plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`)

const exportsMap = {
  '.': {
    types: './dist/index.d.ts',
    default: './dist/index.js'
  },
  './lifecycle': {
    types: './dist/lifecycle.d.ts',
    default: './dist/lifecycle.js'
  }
}
if (withApi) {
  exportsMap['./api'] = {
    types: './dist/api/index.d.ts',
    default: './dist/api/index.js'
  }
}
if (withWeb) {
  exportsMap['./web'] = {
    types: './src/web/index.ts',
    import: './src/web/index.ts',
    default: './src/web/index.ts'
  }
}

writeFileSync(
  path.join(root, 'package.json'),
  `${JSON.stringify(
    {
      name: `@zen/plugin-${id}`,
      version: '0.1.0',
      private: true,
      description: name,
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: exportsMap,
      files: ['dist', 'src/web', 'zen.plugin.json'],
      scripts: {
        build: 'tsc -p tsconfig.build.json',
        'check-types': 'tsc -p tsconfig.build.json --noEmit',
        test: 'vitest run'
      },
      dependencies: {
        '@zen/plugin-sdk': 'workspace:*',
        '@zen/shared': 'workspace:*',
        ...(withWeb
          ? {
              '@tanstack/react-query': '^5.101.4',
              '@zen/ui': 'workspace:*',
              'lucide-react': '^1.27.0'
            }
          : {}),
        zod: '^4.4.3'
      },
      peerDependencies: {
        '@nestjs/common': '^11.0.0',
        ...(withWeb ? { react: '^19.0.0' } : {})
      },
      devDependencies: {
        '@nestjs/common': '^11.1.28',
        '@prisma/client': '^7.9.0',
        '@types/node': '^26.1.1',
        ...(withWeb ? { '@types/react': '19.2.17' } : {}),
        typescript: 'npm:@typescript/typescript6@6.0.2',
        vitest: '^4.1.10'
      }
    },
    null,
    2
  )}\n`
)

writeFileSync(
  path.join(root, 'tsconfig.build.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        rootDir: 'src',
        outDir: 'dist',
        target: 'ES2022',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        declaration: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      },
      include: ['src'],
      exclude: ['src/web']
    },
    null,
    2
  )}\n`
)

writeFileSync(path.join(root, 'src/constants.ts'), `export const ${pluginConst} = '${id}'\n`)

writeFileSync(
  path.join(root, 'src/activate.ts'),
  `import type { PluginContext } from '@zen/plugin-sdk'

export async function activate(ctx: PluginContext): Promise<void> {
  ctx.logger.info('${id} activated', { tenantId: ctx.tenantId })
}
`
)

writeFileSync(
  path.join(root, 'src/deactivate.ts'),
  `import type { PluginContext } from '@zen/plugin-sdk'

export async function deactivate(ctx: PluginContext): Promise<void> {
  ctx.logger.info('${id} deactivated', { tenantId: ctx.tenantId })
}
`
)

writeFileSync(
  path.join(root, 'src/lifecycle.ts'),
  `import type { PluginLifecycleHooks } from '@zen/plugin-sdk'

import { activate } from './activate'
import { deactivate } from './deactivate'

export const lifecycle: PluginLifecycleHooks = {
  onEnable: activate,
  onDisable: deactivate
}
`
)

writeFileSync(
  path.join(root, 'src/index.ts'),
  `export * from './activate'
export * from './constants'
export * from './deactivate'
export * from './lifecycle'
`
)

if (withApi) {
  writeFileSync(
    path.join(root, 'src/api/tokens.ts'),
    `export const ${moduleName.toUpperCase()}_PRISMA = Symbol('${moduleName}.prisma')\n`
  )

  writeFileSync(
    path.join(root, `src/api/${id}.module.ts`),
    `import { Module } from '@nestjs/common'

import { ${moduleName.toUpperCase()}_PRISMA } from './tokens'

import type { DynamicModule, FactoryProvider } from '@nestjs/common'
import type { PrismaClient } from '@prisma/client'

export interface ${moduleName}ModuleOptions {
  prisma: PrismaClient
}

@Module({})
export class ${moduleName}Module {
  static forRoot(options: ${moduleName}ModuleOptions): DynamicModule {
    return {
      module: ${moduleName}Module,
      providers: [{ provide: ${moduleName.toUpperCase()}_PRISMA, useValue: options.prisma }],
      exports: []
    }
  }

  static forRootAsync(options: {
    inject: unknown[]
    useFactory: (...args: unknown[]) => ${moduleName}ModuleOptions | Promise<${moduleName}ModuleOptions>
  }): DynamicModule {
    const prismaProvider: FactoryProvider = {
      provide: ${moduleName.toUpperCase()}_PRISMA,
      inject: options.inject as never[],
      useFactory: async (...args: unknown[]) => {
        const resolved = await options.useFactory(...args)
        return resolved.prisma
      }
    }

    return {
      module: ${moduleName}Module,
      providers: [prismaProvider],
      exports: []
    }
  }
}
`
  )

  writeFileSync(
    path.join(root, 'src/api/index.ts'),
    `export { ${moduleName}Module } from './${id}.module'

export type { ${moduleName}ModuleOptions } from './${id}.module'
`
  )
}

if (withWeb) {
  writeFileSync(
    path.join(root, 'src/web/pages/page.tsx'),
    `export interface ${moduleName}PageProps {
  request: unknown
  can: (permission: string) => boolean
}

export function ${moduleName}Page({ can }: ${moduleName}PageProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold tracking-tight">${name}</h1>
      <p className="text-sm text-muted-foreground">
        由 create-plugin 生成的最小页面。list={String(can('${listPermission}'))}
      </p>
    </div>
  )
}
`
  )

  writeFileSync(
    path.join(root, 'src/web/index.ts'),
    `export { ${moduleName}Page } from './pages/page'

export type { ${moduleName}PageProps } from './pages/page'
`
  )
}

writeFileSync(
  path.join(root, 'tests/manifest.test.ts'),
  `import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('${id} manifest', () => {
  it('id 与目录一致', () => {
    const raw = JSON.parse(readFileSync(join(__dirname, '../zen.plugin.json'), 'utf8')) as {
      id: string
    }
    expect(raw.id).toBe('${id}')
  })
})
`
)

writeFileSync(path.join(root, 'README.md'), `# ${name}\n\n由 \`create-plugin\` 生成。\n`)

console.log(`已创建插件骨架: plugins/${id}`)
const generate = spawnSync('pnpm', ['plugin:generate'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
})
if (generate.status !== 0) {
  console.error('plugin:generate 失败，请修复后手动运行')
  process.exit(generate.status ?? 1)
}
console.log(`下一步: pnpm -F @zen/plugin-${id} check-types`)
