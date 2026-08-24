import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import { MoreHorizontal } from 'lucide-react'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'

import { useFiles } from '../files-provider'
import { CATEGORY_LABEL, formatFileSize, PURPOSE_LABEL, STATUS_LABEL } from '../utils'

import type { FileAsset } from '@zen/shared'

type FilesTableProps = {
  data: FileAsset[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onPreview: (file: FileAsset) => void
}

export function FilesTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onPreview
}: FilesTableProps) {
  const { setOpen, setCurrentRow } = useFiles()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return <EmptyState title="暂无文件" description="上传附件后将显示在这里" compact />
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>文件名</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>用途</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>大小</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="w-16">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="max-w-64 truncate font-medium">{file.originalName}</TableCell>
              <TableCell>{CATEGORY_LABEL[file.category]}</TableCell>
              <TableCell>{PURPOSE_LABEL[file.purpose]}</TableCell>
              <TableCell>
                <Badge variant={file.status === 'deleted' ? 'outline' : 'secondary'}>
                  {STATUS_LABEL[file.status]}
                </Badge>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(file.createdAt).toLocaleString('zh-CN')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" aria-label="文件操作">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Can permission={PermissionCode.FILE_READ}>
                      <DropdownMenuItem onSelect={() => onPreview(file)}>预览</DropdownMenuItem>
                    </Can>
                    {file.status !== 'deleted' ? (
                      <Can permission={PermissionCode.FILE_DELETE}>
                        <DropdownMenuItem
                          onSelect={() => {
                            setCurrentRow(file)
                            setOpen('delete')
                          }}
                        >
                          移入回收站
                        </DropdownMenuItem>
                      </Can>
                    ) : (
                      <Can permission={PermissionCode.FILE_RESTORE}>
                        <DropdownMenuItem
                          onSelect={() => {
                            setCurrentRow(file)
                            setOpen('restore')
                          }}
                        >
                          恢复
                        </DropdownMenuItem>
                      </Can>
                    )}
                    <Can permission={PermissionCode.FILE_PURGE}>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setCurrentRow(file)
                          setOpen('purge')
                        }}
                      >
                        彻底删除
                      </DropdownMenuItem>
                    </Can>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
