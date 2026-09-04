/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createFileRoute } from '@tanstack/react-router'
import { NotesPage } from '@zen/plugin-demo-notes/web'
import { StickyNote } from 'lucide-react'

import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

export const Route = createFileRoute('/_authenticated/plugins/notes')({
  beforeLoad: () => requireActivePlugin('demo-notes'),
  component: function PluginRoutePage() {
    return <PluginPageShell page={NotesPage} />
  },
  staticData: {
    title: '演示便签',
    icon: StickyNote,
    order: 100,
    permissions: ['demo:note:list'],
    pluginId: 'demo-notes'
  }
})
