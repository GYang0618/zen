import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button
} from '@zen/ui'

import { useBatchRemoveOrganizationMembers } from '../queries'
import { organizationMemberName } from './organization-member-card'

import type { OrganizationMember } from '../type'

type OrganizationBatchRemoveDialogProps = {
  organizationId: string
  members: OrganizationMember[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoved: () => void
}

function memberPreview(members: OrganizationMember[]): string {
  const names = members.map(organizationMemberName)
  if (names.length <= 3) return names.join('、')
  return `${names.slice(0, 3).join('、')} 等 ${names.length} 人`
}

export function OrganizationBatchRemoveDialog({
  organizationId,
  members,
  open,
  onOpenChange,
  onRemoved
}: OrganizationBatchRemoveDialogProps) {
  const removeMembers = useBatchRemoveOrganizationMembers(organizationId)

  const handleRemove = async () => {
    if (members.length === 0 || removeMembers.isPending) return
    try {
      await removeMembers.mutateAsync({ userIds: members.map((member) => member.id) })
      onOpenChange(false)
      onRemoved()
    } catch {
      // mutation toast
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>批量移除成员</AlertDialogTitle>
          <AlertDialogDescription>
            确定将「{memberPreview(members)}
            」移出当前组织吗？此操作不会删除其账号或影响其在其他组织中的成员关系。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={removeMembers.isPending || members.length === 0}
            onClick={() => void handleRemove()}
          >
            {removeMembers.isPending ? '正在移除…' : '移除成员'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
