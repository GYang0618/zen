import { PermissionCode } from '@zen/shared'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useOrganizationTree } from '@/features/system/organization/queries'
import { findOrganization, flattenOrganizations } from '@/features/system/organization/utils'

import { useReplaceUserOrganizationsMutation } from '../mutations'
import { getMembershipChanges, getUserDisplayName, seedMembershipDrafts } from '../utils'
import { AssignUserOrganizationsEditor } from './assign-user-organizations-editor'
import { AssignmentChangeSummary, AssignmentSessionAlert } from './assignment-panels'

import type { User } from '@zen/shared'
import type { MembershipDraft } from '../utils'

type AssignStep = 'edit' | 'confirm'

type AssignUserOrganizationsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function AssignUserOrganizationsDialog({
  open,
  onOpenChange,
  user
}: AssignUserOrganizationsDialogProps) {
  const { mutateAsync: replaceOrganizations, isPending } = useReplaceUserOrganizationsMutation()
  const {
    data: tree = [],
    isLoading: treeLoading,
    isError: treeError,
    refetch
  } = useOrganizationTree(open)
  const [memberships, setMemberships] = useState<MembershipDraft[]>([])
  const [primaryOrgId, setPrimaryOrgId] = useState('')
  const [step, setStep] = useState<AssignStep>('edit')
  const [discardOpen, setDiscardOpen] = useState(false)
  const initialRef = useRef(seedMembershipDrafts(user.organizations))

  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在打开时灌入草稿
  useEffect(() => {
    if (!open) return
    const seeded = seedMembershipDrafts(user.organizations)
    initialRef.current = seeded
    setMemberships(seeded.memberships)
    setPrimaryOrgId(seeded.primaryOrgId)
    setStep('edit')
    setDiscardOpen(false)
  }, [open])

  const selectedIds = useMemo(
    () => new Set(memberships.map((item) => item.organizationId)),
    [memberships]
  )
  const allOrgIds = useMemo(
    () => new Set(flattenOrganizations(tree).map((node) => node.id)),
    [tree]
  )
  const selectableIds = useMemo(() => {
    const next = new Set(allOrgIds)
    for (const id of selectedIds) next.delete(id)
    return next
  }, [allOrgIds, selectedIds])
  const changes = getMembershipChanges(
    initialRef.current.memberships,
    initialRef.current.primaryOrgId,
    memberships,
    primaryOrgId
  )

  const resolveOrgName = (organizationId: string) =>
    findOrganization(tree, organizationId)?.name ??
    user.organizations.find((item) => item.organizationId === organizationId)?.organizationName ??
    organizationId

  const resolveOrgType = (organizationId: string) =>
    findOrganization(tree, organizationId)?.type ??
    user.organizations.find((item) => item.organizationId === organizationId)?.organizationType

  const resolvePostLabel = (draft: MembershipDraft | undefined) => {
    if (!draft?.postId) return '未设岗位'
    return draft.postName ?? '已选岗位'
  }

  const requestClose = () => {
    if (isPending) return
    if (changes.isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const handleAdd = (organizationId: string) => {
    if (!organizationId) return
    setMemberships((prev) => {
      if (prev.some((item) => item.organizationId === organizationId)) return prev
      return [...prev, { organizationId, postId: '' }]
    })
    setPrimaryOrgId((prev) => prev || organizationId)
  }

  const handleRemove = (organizationId: string) => {
    const next = memberships.filter((item) => item.organizationId !== organizationId)
    setMemberships(next)
    if (primaryOrgId === organizationId) {
      setPrimaryOrgId(next[0]?.organizationId ?? '')
    }
  }

  const handleSubmit = async () => {
    try {
      await replaceOrganizations({
        id: user.id,
        organizations: memberships.map((item) => ({
          organizationId: item.organizationId,
          isPrimary: item.organizationId === primaryOrgId,
          postId: item.postId || null
        }))
      })
      toast.success('组织归属已更新，目标用户需重新登录')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新组织失败')
    }
  }

  const changeDetails = [
    ...(changes.primaryChanged
      ? [
          {
            id: 'primary',
            label: `主职：${initialRef.current.primaryOrgId ? resolveOrgName(initialRef.current.primaryOrgId) : '无'} → ${primaryOrgId ? resolveOrgName(primaryOrgId) : '无'}`
          }
        ]
      : []),
    ...changes.postChangedIds.map((organizationId) => {
      const initial = initialRef.current.memberships.find(
        (item) => item.organizationId === organizationId
      )
      const next = memberships.find((item) => item.organizationId === organizationId)
      return {
        id: `post-${organizationId}`,
        label: `${resolveOrgName(organizationId)} 岗位：${resolvePostLabel(initial)} → ${resolvePostLabel(next)}`
      }
    })
  ]

  const copy = getSheetCopy(step, getUserDisplayName(user))

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : requestClose())}>
        <SheetContent className="sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4">
          {step === 'confirm' ? (
            <div className="flex flex-col gap-4 py-2">
              <AssignmentChangeSummary
                added={changes.addedIds.map((id) => ({ id, label: resolveOrgName(id) }))}
                removed={changes.removedIds.map((id) => ({ id, label: resolveOrgName(id) }))}
                details={changeDetails}
              />
              <AssignmentSessionAlert />
            </div>
          ) : null}

          {step === 'edit' ? (
            <AssignUserOrganizationsEditor
              treeLoading={treeLoading && tree.length === 0}
              treeError={treeError}
              hasAvailableOrgs={selectableIds.size > 0}
              tree={tree}
              selectableIds={selectableIds}
              memberships={memberships}
              primaryOrgId={primaryOrgId}
              resolveOrgName={resolveOrgName}
              resolveOrgType={resolveOrgType}
              onRetry={() => {
                void refetch()
              }}
              onAdd={handleAdd}
              onPrimaryChange={setPrimaryOrgId}
              onPostChange={(organizationId, postId, postName) => {
                setMemberships((prev) =>
                  prev.map((item) =>
                    item.organizationId === organizationId ? { ...item, postId, postName } : item
                  )
                )
              }}
              onRemove={handleRemove}
            />
          ) : null}
        </div>

        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          {step === 'edit' ? (
            <>
              <Button type="button" variant="outline" onClick={requestClose}>
                取消
              </Button>
              <Can permission={PermissionCode.ORG_UPDATE}>
                <Button
                  type="button"
                  disabled={treeLoading || !changes.isDirty}
                  onClick={() => setStep('confirm')}
                >
                  查看变更
                </Button>
              </Can>
            </>
          ) : null}
          {step === 'confirm' ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setStep('edit')}
              >
                返回
              </Button>
              <Can permission={PermissionCode.ORG_UPDATE}>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    void handleSubmit()
                  }}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : null}
                  {isPending ? '保存中…' : '确认保存'}
                </Button>
              </Can>
            </>
          ) : null}
        </SheetFooter>
      </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="放弃更改？"
        desc="有未保存的组织归属变更。关闭后，组织、岗位和主职的修改不会被保存。"
        cancelBtnText="继续编辑"
        confirmText="放弃更改"
        destructive
        handleConfirm={() => {
          setDiscardOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}

function getSheetCopy(step: AssignStep, displayName: string) {
  if (step === 'confirm') {
    return {
      title: '确认组织变更',
      description: `保存后将覆盖 ${displayName} 的组织归属，并强制下线现有会话。`
    }
  }
  return {
    title: '管理组织归属',
    description: `为 ${displayName} 添加组织、设置岗位与主职，保存前可预览变更。`
  }
}
