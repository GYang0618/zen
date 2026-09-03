/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createFileRoute } from '@tanstack/react-router'
import { JobsPage } from '@zen/plugin-jobs/web'
import { ListTodo } from 'lucide-react'

import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

export const Route = createFileRoute('/_authenticated/plugins/jobs')({
  beforeLoad: () => requireActivePlugin('jobs'),
  component: function PluginRoutePage() {
    return <PluginPageShell page={JobsPage} />
  },
  staticData: {
    title: '任务中心',
    icon: ListTodo,
    order: 130,
    permissions: ['job:task:list'],
    pluginId: 'jobs'
  }
})
