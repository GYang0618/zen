/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import type { PluginRegistryEntry } from '@zen/plugin-sdk'

export const PLUGIN_CATALOG = [
  {
    "id": "demo-notes",
    "name": "演示便签",
    "version": "0.1.0",
    "platformVersion": "^0.1.0",
    "dependsOn": [],
    "permissions": [
      {
        "code": "demo:note:list",
        "name": "查看便签列表",
        "module": "demo",
        "description": "分页或列表查询便签"
      },
      {
        "code": "demo:note:get",
        "name": "查看便签详情",
        "module": "demo",
        "description": "按 ID 查看便签"
      },
      {
        "code": "demo:note:create",
        "name": "创建便签",
        "module": "demo",
        "description": "创建便签"
      },
      {
        "code": "demo:note:update",
        "name": "更新便签",
        "module": "demo",
        "description": "更新便签"
      },
      {
        "code": "demo:note:delete",
        "name": "删除便签",
        "module": "demo",
        "description": "删除便签"
      }
    ],
    "api": {
      "entry": "./src/api/demo-notes.module",
      "export": "DemoNotesModule"
    },
    "routes": [
      {
        "id": "demo-notes-home",
        "path": "/plugins/notes",
        "entry": "./src/web/pages/notes-page",
        "componentExport": "NotesPage",
        "title": "演示便签",
        "icon": "sticky-note",
        "order": 100,
        "permissions": [
          "demo:note:list"
        ]
      }
    ],
    "config": {
      "entry": "./src/config.schema.ts",
      "schemaExport": "demoNotesConfigSchema"
    },
    "lifecycle": {
      "entry": "./src/lifecycle.ts",
      "export": "lifecycle"
    },
    "events": [
      "demo.note.created"
    ],
    "agentTools": {
      "entry": "./src/agent/tools.ts",
      "export": "demoNotesAgentTools"
    },
    "packageDir": "plugins/demo-notes"
  },
  {
    "id": "files",
    "name": "文件管理",
    "version": "0.1.0",
    "platformVersion": "^0.1.0",
    "dependsOn": [],
    "permissions": [
      {
        "code": "file:object:list",
        "name": "查看文件列表",
        "module": "file",
        "description": "查看当前用户文件列表"
      },
      {
        "code": "file:object:manage",
        "name": "管理文件",
        "module": "file",
        "description": "上传/删除文件"
      }
    ],
    "api": {
      "entry": "./src/api/files.module",
      "export": "FilesModule"
    },
    "routes": [
      {
        "id": "files-home",
        "path": "/plugins/files",
        "entry": "./src/web/pages/files-page",
        "componentExport": "FilesPage",
        "title": "文件管理",
        "icon": "folder-kanban",
        "order": 120,
        "permissions": [
          "file:object:list"
        ]
      }
    ],
    "lifecycle": {
      "entry": "./src/lifecycle.ts",
      "export": "lifecycle"
    },
    "packageDir": "plugins/files"
  },
  {
    "id": "jobs",
    "name": "任务中心",
    "version": "0.1.0",
    "platformVersion": "^0.1.0",
    "dependsOn": [],
    "permissions": [
      {
        "code": "job:task:list",
        "name": "查看任务列表",
        "module": "job",
        "description": "查看租户任务记录"
      },
      {
        "code": "job:task:manage",
        "name": "管理任务",
        "module": "job",
        "description": "创建任务"
      }
    ],
    "api": {
      "entry": "./src/api/jobs.module",
      "export": "JobsModule"
    },
    "routes": [
      {
        "id": "jobs-home",
        "path": "/plugins/jobs",
        "entry": "./src/web/pages/jobs-page",
        "componentExport": "JobsPage",
        "title": "任务中心",
        "icon": "list-todo",
        "order": 130,
        "permissions": [
          "job:task:list"
        ]
      }
    ],
    "lifecycle": {
      "entry": "./src/lifecycle.ts",
      "export": "lifecycle"
    },
    "packageDir": "plugins/jobs"
  },
  {
    "id": "notifications",
    "name": "通知中心",
    "version": "0.1.0",
    "platformVersion": "^0.1.0",
    "dependsOn": [],
    "permissions": [
      {
        "code": "notif:message:list",
        "name": "查看通知列表",
        "module": "notif",
        "description": "查看当前用户通知列表"
      },
      {
        "code": "notif:message:manage",
        "name": "管理通知",
        "module": "notif",
        "description": "创建通知"
      }
    ],
    "api": {
      "entry": "./src/api/notifications.module",
      "export": "NotificationsModule"
    },
    "routes": [
      {
        "id": "notifications-home",
        "path": "/plugins/notifications",
        "entry": "./src/web/pages/notifications-page",
        "componentExport": "NotificationsPage",
        "title": "通知中心",
        "icon": "bell",
        "order": 110,
        "permissions": [
          "notif:message:list"
        ]
      }
    ],
    "lifecycle": {
      "entry": "./src/lifecycle.ts",
      "export": "lifecycle"
    },
    "packageDir": "plugins/notifications"
  }
] as const satisfies readonly PluginRegistryEntry[]

export type CatalogPluginId = (typeof PLUGIN_CATALOG)[number]['id']

