import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem
} from '@zen/ui'
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Building2,
  GitMerge,
  Trash2,
  Users
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useDeleteOrganization, useDissolveOrganization } from '../queries'
import { collectDescendantIds } from '../utils'
import { OrganizationParentSelect } from './organization-parent-select'

import type { OrganizationTreeNode } from '@zen/shared'
import type { Organization } from '../type'

interface OrganizationDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: OrganizationTreeNode | null
  tree: OrganizationTreeNode[]
  onSuccess?: () => void
}

type ChildrenStrategy = 'retain' | 'cascade_delete'

export function OrganizationDeleteDialog({
  open,
  onOpenChange,
  target,
  tree,
  onSuccess
}: OrganizationDeleteDialogProps) {
  const { mutate: deleteOrg, isPending: isDeleting } = useDeleteOrganization()
  const { mutate: dissolveOrg, isPending: isDissolving } = useDissolveOrganization()

  const [confirmCode, setConfirmCode] = useState('')
  const [targetOrgId, setTargetOrgId] = useState<string>('')
  const [childrenStrategy, setChildrenStrategy] = useState<ChildrenStrategy>('retain')
  const [targetChildrenOrgId, setTargetChildrenOrgId] = useState<string>('')
  const [clearMembersOnly, setClearMembersOnly] = useState(false)

  const hasChildren = Boolean(target?.children && target.children.length > 0)
  const hasMembers = Boolean(target && target.memberCount > 0)
  const hasPositions = Boolean(target && target.positionCount > 0)
  const isDirectDeletable = !hasChildren && !hasMembers && !hasPositions

  // 排除自身及所有后代，防止将子部门或成员移入自身或后代
  const excludeIds = useMemo(() => {
    if (!target) return new Set<string>()
    const ids = new Set<string>([target.id])
    for (const id of collectDescendantIds(tree as unknown as Organization[], target.id)) {
      ids.add(id)
    }
    return ids
  }, [target, tree])

  useEffect(() => {
    if (!open || !target) {
      setConfirmCode('')
      setTargetOrgId('')
      setChildrenStrategy('retain')
      setTargetChildrenOrgId('')
      setClearMembersOnly(false)
      return
    }

    if (target.parentId && !excludeIds.has(target.parentId)) {
      setTargetOrgId(target.parentId)
    } else {
      setTargetOrgId('')
    }
    setClearMembersOnly(!target.parentId)
  }, [open, target, excludeIds])

  if (!target) return null

  const isPending = isDeleting || isDissolving

  const handleConfirm = () => {
    if (isDirectDeletable) {
      deleteOrg(target.id, {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        }
      })
      return
    }

    const destinationId = clearMembersOnly ? null : targetOrgId.trim() || null

    if (hasMembers && !clearMembersOnly && !destinationId) {
      toast.error('请选择在岗成员的接收组织，或选择直接清空部门任职')
      return
    }

    const transferChildren = childrenStrategy === 'retain'
    const finalTargetChildrenOrgId =
      transferChildren && targetChildrenOrgId.trim() ? targetChildrenOrgId.trim() : null

    dissolveOrg(
      {
        id: target.id,
        data: {
          targetOrganizationId: destinationId,
          transferChildren,
          targetChildrenOrganizationId: finalTargetChildrenOrgId
        }
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        }
      }
    )
  }

  const canSubmit = isDirectDeletable
    ? confirmCode.trim() === target.code
    : clearMembersOnly || Boolean(targetOrgId) || !hasMembers

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            {isDirectDeletable ? '删除组织' : '解散组织与分流安置'}
          </DialogTitle>
          <DialogDescription>
            您正在对组织 <span className="font-semibold text-foreground">{target.name}</span>{' '}
            进行操作。
          </DialogDescription>
        </DialogHeader>

        {isDirectDeletable ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              该组织没有下级部门、在岗成员及岗位编制，可直接安全删除。此操作无法撤销。
            </p>
            <Field>
              <FieldLabel className="text-sm">
                请输入组织编码 <span className="font-bold text-foreground">{target.code}</span>{' '}
                以确认删除：
              </FieldLabel>
              <Input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="输入组织编码确认"
                autoComplete="off"
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <Alert className="border-destructive/20 bg-destructive/5 text-destructive">
              <AlertTitle className="font-semibold">检测到业务关联依赖</AlertTitle>
              <AlertDescription className="mt-1 flex flex-wrap gap-2 text-xs">
                {hasChildren ? (
                  <Badge variant="outline" className="border-destructive/30">
                    下级部门 {target.children.length} 个
                  </Badge>
                ) : null}
                {hasMembers ? (
                  <Badge variant="outline" className="border-destructive/30">
                    在岗成员 {target.memberCount} 人
                  </Badge>
                ) : null}
                {hasPositions ? (
                  <Badge variant="outline" className="border-destructive/30">
                    岗位编制 {target.positionCount} 个
                  </Badge>
                ) : null}
              </AlertDescription>
            </Alert>

            {/* 下级子部门处置方式 */}
            {hasChildren ? (
              <div className="rounded-lg border p-3 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-1.5 text-foreground">
                    <Building2 className="size-4 text-primary" />
                    下级子部门处置策略 ({target.children.length} 个部门)
                  </span>
                </div>

                <RadioGroup
                  value={childrenStrategy}
                  onValueChange={(val) => setChildrenStrategy(val as ChildrenStrategy)}
                  className="gap-2.5"
                >
                  <label
                    htmlFor="strategy-retain"
                    className="flex cursor-pointer items-start gap-2.5 rounded-md border bg-background p-2.5 shadow-xs transition-colors hover:bg-muted/30"
                  >
                    <RadioGroupItem value="retain" id="strategy-retain" className="mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ArrowUpRight className="size-3.5 text-primary" />
                        保留子部门（提升或合并）
                        <Badge variant="secondary" className="h-4 px-1 py-0 text-[10px]">
                          推荐
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        子部门不删除。可指定合并入新的目标部门；若未指定，则自动提升一级挂靠至上级组织。
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="strategy-cascade"
                    className="flex cursor-pointer items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 shadow-xs transition-colors hover:bg-destructive/10"
                  >
                    <RadioGroupItem
                      value="cascade_delete"
                      id="strategy-cascade"
                      className="mt-0.5"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                        <Trash2 className="size-3.5" />
                        连同子部门一起彻底删除
                      </div>
                      <p className="text-[11px] text-destructive/80">
                        当前部门及所有下级子部门将被级联注销删除，下级员工按下方策略一并分流。
                      </p>
                    </div>
                  </label>
                </RadioGroup>

                {/* 若选择保留，提供指定合并目标部门选项 */}
                {childrenStrategy === 'retain' ? (
                  <div className="pt-1.5 space-y-1.5 border-t">
                    <Label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <GitMerge className="size-3 text-muted-foreground" />
                      子部门合并接收部门 (可选)：
                    </Label>
                    <OrganizationParentSelect
                      value={targetChildrenOrgId}
                      onValueChange={setTargetChildrenOrgId}
                      tree={tree as unknown as Organization[]}
                      excludeIds={excludeIds}
                      placeholder="未选择时自动提升一级（挂靠至父级组织）"
                      allowEmpty
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {targetChildrenOrgId
                        ? '选定接收组织后，全部子部门将划转合并为该组织的直接下级。'
                        : '未选择接收部门，全部子部门将自动提升一级，确保组织树结构不断裂。'}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* 在岗成员分流安置 */}
            {hasMembers ? (
              <div className="rounded-lg border p-3 space-y-3">
                <div className="font-medium flex items-center gap-1.5 text-foreground">
                  <Users className="size-4 text-primary" />
                  在岗成员分流安置 ({target.memberCount} 人)
                </div>

                {!clearMembersOnly ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      选择接收成员的目标部门：
                    </Label>
                    <OrganizationParentSelect
                      value={targetOrgId}
                      onValueChange={setTargetOrgId}
                      tree={tree as unknown as Organization[]}
                      excludeIds={excludeIds}
                      placeholder="请选择接收成员的目标组织"
                    />
                  </div>
                ) : null}

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="clear-members"
                    checked={clearMembersOnly}
                    onCheckedChange={(checked) => setClearMembersOnly(Boolean(checked))}
                  />
                  <label
                    htmlFor="clear-members"
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    直接解除当前组织的成员任职（不平移至其他部门）
                  </label>
                </div>
              </div>
            ) : null}

            {/* 编制处理说明 */}
            {hasPositions ? (
              <div className="rounded-lg border p-3 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-4" />
                  当前组织设立的 {target.positionCount} 个岗位编制
                </span>
                <span>将自动安全解绑并归档</span>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canSubmit || isPending}>
            {isPending ? '处理中…' : isDirectDeletable ? '确认删除' : '确认解散并执行安置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
