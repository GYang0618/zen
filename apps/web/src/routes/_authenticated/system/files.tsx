import { createFileRoute } from '@tanstack/react-router'
import { FolderOpen } from 'lucide-react'

import { FilesPage } from '@/features/system/files'

export const Route = createFileRoute('/_authenticated/system/files')({
  component: FilesPage,
  staticData: {
    title: '文件管理',
    description: '按图片、视频、文档、压缩包分类管理；预览需读取权限，上传/删除另需对应权限',
    icon: FolderOpen,
    order: 45,
    permissions: ['system:file:list']
  }
})
