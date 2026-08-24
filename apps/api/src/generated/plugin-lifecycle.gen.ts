/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import type { PluginLifecycleHooks } from '@zen/plugin-sdk'
import { lifecycle as lifecycle_demo_notes } from '@zen/plugin-demo-notes/lifecycle'
import { lifecycle as lifecycle_jobs } from '@zen/plugin-jobs/lifecycle'
import { lifecycle as lifecycle_notifications } from '@zen/plugin-notifications/lifecycle'

export const PLUGIN_LIFECYCLE_HOOKS = {
  'demo-notes': lifecycle_demo_notes,
  'jobs': lifecycle_jobs,
  'notifications': lifecycle_notifications
} as const satisfies Record<string, PluginLifecycleHooks>

