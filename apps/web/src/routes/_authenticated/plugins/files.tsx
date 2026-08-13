/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createFileRoute } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'
import { FilesPage } from '@zen/plugin-files/web'

import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

export const Route = createFileRoute('/_authenticated/plugins/files')({
  beforeLoad: () => requireActivePlugin('files'),
  component: function PluginRoutePage() {
    return <PluginPageShell page={FilesPage} />
  },
  staticData: {
    title: "文件管理",
    icon: FolderKanban,
    order: 120,
    permissions: ["file:object:list"],
    pluginId: 'files'
  }
})

