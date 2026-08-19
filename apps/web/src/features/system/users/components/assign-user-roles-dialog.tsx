import { PermissionCode } from '@zen/shared'
import {
  Button,
  Field,
  FieldLabel,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { authApi } from '@/features/auth/api'

import { useAssignUserRolesMutation } from '../mutations'
import { useRoleOptionsQuery } from '../queries'
import { diffIdLists, getUserDisplayName } from '../utils'
import { AssignUserRolesPicker } from './assign-user-roles-picker'
import { AssignmentChangeSummary, AssignmentSessionAlert } from './assignment-panels'

import type { User } from '@zen/shared'

type AssignStep = 'edit' | 'confirm'

type AssignUserRolesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function AssignUserRolesDialog({ open, onOpenChange, user }: AssignUserRolesDialogProps) {
  const { data, isLoading } = useRoleOptionsQuery(open)
  const { mutateAsync: assignRoles, isPending } = useAssignUserRolesMutation()
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [keyword, setKeyword] = useState('')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [step, setStep] = useState<AssignStep>('edit')
  const [selectionError, setSelectionError] = useState<string>()
  const [discardOpen, setDiscardOpen] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在打开时灌入草稿，避免保存后详情刷新触发 Checkbox 循环更新
  useEffect(() => {
    if (!open) return
    setRoleIds(user.roles.map((role) => role.id))
    setPassword('')
    setKeyword('')
    setShowSelectedOnly(false)
    setStep('edit')
    setSelectionError(undefined)
    setDiscardOpen(false)
  }, [open])

  const initialRoleIds = useMemo(() => user.roles.map((role) => role.id), [user.roles])
  const { addedIds, removedIds } = diffIdLists(initialRoleIds, roleIds)
  const isDirty = addedIds.length > 0 || removedIds.length > 0

  const toggleRole = (roleId: string, checked: boolean) => {
    setSelectionError(undefined)
    setRoleIds((prev) => {
      if (checked) {
        if (prev.includes(roleId)) return prev
        return [...prev, roleId]
      }
      return prev.filter((id) => id !== roleId)
    })
  }

  const requestClose = () => {
    if (isPending) return
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (roleIds.length === 0) {
      setSelectionError('至少保留一个角色')
      setStep('edit')
      return
    }
    try {
      const { stepUpToken } = await authApi.stepUp({ password })
      await assignRoles({ id: user.id, roleIds, stepUpToken })
      toast.success('角色已更新，目标用户需重新登录')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '分配角色失败')
    }
  }

  const roles = data?.items ?? []
  const normalizedKeyword = keyword.trim().toLocaleLowerCase()
  const selectedRoles = roleIds.flatMap((roleId) => {
    const role =
      roles.find((item) => item.id === roleId) ?? user.roles.find((item) => item.id === roleId)
    return role ? [role] : []
  })
  const visibleRoles = roles.filter((role) => {
    if (showSelectedOnly && !roleIds.includes(role.id)) return false
    if (!normalizedKeyword) return true

    return [role.name, role.code, role.description]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalizedKeyword))
  })

  const resolveRoleLabel = (roleId: string) =>
    roles.find((item) => item.id === roleId)?.name ??
    user.roles.find((item) => item.id === roleId)?.name ??
    roleId

  const copy = getSheetCopy(step, getUserDisplayName(user))

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : requestClose())}>
        <SheetContent className="sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div
          className={
            step === 'edit'
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-4'
              : 'flex-1 overflow-y-auto overscroll-contain px-4'
          }
        >
          {step === 'confirm' ? (
            <div className="flex flex-col gap-4 py-2">
              <AssignmentChangeSummary
                added={addedIds.map((id) => ({ id, label: resolveRoleLabel(id) }))}
                removed={removedIds.map((id) => ({ id, label: resolveRoleLabel(id) }))}
              />
              <Field>
                <FieldLabel htmlFor="assign-role-password">当前登录密码</FieldLabel>
                <PasswordInput
                  id="assign-role-password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="输入当前登录密码以确认变更"
                />
              </Field>
              <AssignmentSessionAlert />
            </div>
          ) : null}

          {step === 'edit' ? (
            <div className="flex min-h-0 flex-1 flex-col py-2">
              <AssignUserRolesPicker
                isLoading={isLoading}
                roles={roles}
                visibleRoles={visibleRoles}
                selectedRoles={selectedRoles}
                roleIds={roleIds}
                keyword={keyword}
                showSelectedOnly={showSelectedOnly}
                selectionError={selectionError}
                onKeywordChange={setKeyword}
                onShowSelectedOnlyChange={setShowSelectedOnly}
                onToggle={toggleRole}
                onClear={() => {
                  setRoleIds([])
                  setShowSelectedOnly(false)
                  setSelectionError('至少保留一个角色')
                }}
              />
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          {step === 'edit' ? (
            <>
              <Button type="button" variant="outline" onClick={requestClose}>
                取消
              </Button>
              <Can permission={PermissionCode.ROLE_ASSIGN}>
                <Button
                  type="button"
                  disabled={isLoading || !isDirty || roleIds.length === 0}
                  onClick={() => {
                    if (roleIds.length === 0) {
                      setSelectionError('至少保留一个角色')
                      return
                    }
                    setStep('confirm')
                  }}
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
              <Can permission={PermissionCode.ROLE_ASSIGN}>
                <Button
                  type="button"
                  disabled={isPending || !password}
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
        desc="有未保存的角色变更。关闭后，已勾选或取消的角色不会被保存。"
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
      title: '确认角色变更',
      description: `保存后将覆盖 ${displayName} 的角色，并强制下线现有会话。`
    }
  }
  return {
    title: '管理角色',
    description: `为 ${displayName} 选择角色，保存前可预览变更。`
  }
}
