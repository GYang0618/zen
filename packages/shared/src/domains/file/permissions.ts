import { defineKernelPermissions } from '../permission/define-permissions'

export const FILE_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'file',
  moduleLabel: '文件管理',
  items: [
    { action: 'list', name: '查看文件列表', description: '分页查询可见范围内的文件元数据' },
    { action: 'read', name: '读取文件', description: '预览或下载可见范围内的文件' },
    { action: 'upload', name: '上传文件', description: '从文件库主动上传（不含自助头像）' },
    { action: 'delete', name: '删除文件', description: '将文件移入回收站' },
    { action: 'restore', name: '恢复文件', description: '从回收站恢复文件' },
    { action: 'purge', name: '彻底删除文件', description: '不可逆清除对象与元数据' }
  ]
} as const)

export const STORAGE_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'storage',
  moduleLabel: '对象存储',
  items: [
    { action: 'read', name: '查看存储策略', description: '查看对象存储策略与配额' },
    { action: 'update', name: '更新存储策略', description: '维护对象存储非密钥策略' }
  ]
} as const)
