/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { DemoNotesModule } from '@zen/plugin-demo-notes/api'
import { FilesModule } from '@zen/plugin-files/api'
import { JobsModule } from '@zen/plugin-jobs/api'
import { NotificationsModule } from '@zen/plugin-notifications/api'

export const PLUGIN_API_LOADERS = [
  { id: 'demo-notes' as const, module: DemoNotesModule },
  { id: 'files' as const, module: FilesModule },
  { id: 'jobs' as const, module: JobsModule },
  { id: 'notifications' as const, module: NotificationsModule }
] as const

export type PluginApiLoader = (typeof PLUGIN_API_LOADERS)[number]

