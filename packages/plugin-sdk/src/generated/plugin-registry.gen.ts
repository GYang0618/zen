/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import type { PluginRegistryEntry } from '../types'

export const PLUGIN_REGISTRY = [
  {
    id: 'demo-notes',
    name: '演示便签',
    version: '0.1.0',
    platformVersion: '^0.1.0',
    dependsOn: [],
    permissions: [
      {
        code: 'demo:note:list',
        name: '查看便签列表',
        module: 'demo',
        description: '分页或列表查询便签'
      },
      {
        code: 'demo:note:get',
        name: '查看便签详情',
        module: 'demo',
        description: '按 ID 查看便签'
      },
      {
        code: 'demo:note:create',
        name: '创建便签',
        module: 'demo',
        description: '创建便签'
      },
      {
        code: 'demo:note:update',
        name: '更新便签',
        module: 'demo',
        description: '更新便签'
      },
      {
        code: 'demo:note:delete',
        name: '删除便签',
        module: 'demo',
        description: '删除便签'
      }
    ],
    contributions: {
      routes: './src/web/routes',
      apiModule: './src/api/demo-notes.module',
      agentTools: './src/agent/tools.ts',
      events: ['demo.note.created'],
      configSchema: './src/config.schema.ts'
    },
    lifecycle: {
      activate: './src/activate.ts',
      deactivate: './src/deactivate.ts'
    },
    packageDir: 'plugins/demo-notes'
  },
  {
    id: 'files',
    name: '文件管理',
    version: '0.1.0',
    platformVersion: '^0.1.0',
    dependsOn: [],
    permissions: [
      {
        code: 'file:object:list',
        name: '查看文件列表',
        module: 'file',
        description: '查看当前用户文件列表'
      },
      {
        code: 'file:object:manage',
        name: '管理文件',
        module: 'file',
        description: '上传/删除文件'
      }
    ],
    contributions: {
      routes: './src/web/routes',
      apiModule: './src/api/files.module'
    },
    lifecycle: {
      activate: './src/activate.ts',
      deactivate: './src/deactivate.ts'
    },
    packageDir: 'plugins/files'
  },
  {
    id: 'hello-stub',
    name: 'Hello Stub',
    version: '0.1.0',
    platformVersion: '^0.1.0',
    dependsOn: [],
    permissions: [
      {
        code: 'stub:hello:list',
        name: '查看 Hello Stub',
        module: 'stub',
        description: 'Phase 2 占位插件权限，用于校验与启停演示'
      }
    ],
    contributions: {},
    packageDir: 'plugins/hello-stub'
  },
  {
    id: 'jobs',
    name: '任务中心',
    version: '0.1.0',
    platformVersion: '^0.1.0',
    dependsOn: [],
    permissions: [
      {
        code: 'job:task:list',
        name: '查看任务列表',
        module: 'job',
        description: '查看租户任务记录'
      },
      {
        code: 'job:task:manage',
        name: '管理任务',
        module: 'job',
        description: '创建任务'
      }
    ],
    contributions: {
      routes: './src/web/routes',
      apiModule: './src/api/jobs.module'
    },
    lifecycle: {
      activate: './src/activate.ts',
      deactivate: './src/deactivate.ts'
    },
    packageDir: 'plugins/jobs'
  },
  {
    id: 'notifications',
    name: '通知中心',
    version: '0.1.0',
    platformVersion: '^0.1.0',
    dependsOn: [],
    permissions: [
      {
        code: 'notif:message:list',
        name: '查看通知列表',
        module: 'notif',
        description: '查看当前用户通知列表'
      },
      {
        code: 'notif:message:manage',
        name: '管理通知',
        module: 'notif',
        description: '创建通知'
      }
    ],
    contributions: {
      routes: './src/web/routes',
      apiModule: './src/api/notifications.module'
    },
    lifecycle: {
      activate: './src/activate.ts',
      deactivate: './src/deactivate.ts'
    },
    packageDir: 'plugins/notifications'
  }
] as const satisfies readonly PluginRegistryEntry[]

export type GeneratedPluginId = (typeof PLUGIN_REGISTRY)[number]['id']
