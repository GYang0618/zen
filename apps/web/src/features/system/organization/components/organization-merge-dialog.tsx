import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel
} from '@zen/ui'
import { AlertTriangle, Building2, GitMerge } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useMergeOrganization, useOrganizationTree } from '../queries'
import { OrganizationParentSelect } from './organization-parent-select'

import type { Organization } from '../type'

type MergeSourceOrganization = {
  id: string
  name: string
  memberCount?: number
  children?: Organization[]
}

interface OrganizationMergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceOrganization: MergeSourceOrganization | null
  onSuccess?: () => void
}

function collectSubtreeIds(node: MergeSourceOrganization): string[] {
  return [node.id, ...(node.children ?? []).flatMap(collectSubtreeIds)]
}

export function OrganizationMergeDialog({
  open,
  onOpenChange,
  sourceOrganization,
  onSuccess
}: OrganizationMergeDialogProps) {
  const { data: tree = [] } = useOrganizationTree()
  const [targetOrgId, setTargetOrgId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mergeMutation = useMergeOrganization()

  // 排除源组织自身及其所有子树，防止循环引用
  const excludeIds = useMemo(() => {
    if (!sourceOrganization) return new Set<string>()
    return new Set(collectSubtreeIds(sourceOrganization))
  }, [sourceOrganization])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTargetOrgId('')
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleMerge = async () => {
    if (!sourceOrganization) return
    if (!targetOrgId) {
      setError('请选择合并目标部门')
      return
    }

    try {
      await mergeMutation.mutateAsync({
        id: sourceOrganization.id,
        data: {
          targetOrganizationId: targetOrgId
        }
      })
      toast.success(`成功将「${sourceOrganization.name}」合并入目标组织`)
      onSuccess?.()
      handleOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '组织合并失败')
    }
  }

  if (!sourceOrganization) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GitMerge className="size-5" />
            </div>
            <div>
              <DialogTitle>组织合并向导</DialogTitle>
              <DialogDescription>
                将「{sourceOrganization.name}」合并至指定目标组织
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 目标部门选择 */}
          <Field className="space-y-1.5">
            <FieldLabel className="text-sm font-medium">
              <Building2 className="mr-1 inline-block size-4 text-muted-foreground" />
              合并入目标部门 / 团队 <span className="text-destructive">*</span>
            </FieldLabel>
            <OrganizationParentSelect
              value={targetOrgId}
              onValueChange={(val) => {
                setTargetOrgId(val)
                setError(null)
              }}
              tree={tree}
              excludeIds={excludeIds}
              placeholder="请选择接收合并的目标部门"
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>

          {/* 影响说明 */}
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="size-4" />
            <AlertTitle>合并操作说明与规则</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <p>• 该部门的全部下级子部门将自动挂载至目标组织下方；</p>
              <p>• 原部门成员与岗位编制将整体安全划转至目标组织；</p>
              <p>• 合并完成后，「{sourceOrganization.name}」将被注销清理；</p>
              <p>• 涉事员工的权限缓存将实时刷新，此操作不可逆，请谨慎确认。</p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mergeMutation.isPending}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={() => void handleMerge()}
            disabled={mergeMutation.isPending || !targetOrgId}
          >
            {mergeMutation.isPending ? '正在合并…' : '确认合并并注销原部门'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
