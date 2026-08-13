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

import { useRemoveOrganizationMember } from '../queries'

import type { OrganizationMember } from '../type'

type OrganizationRemoveMemberDialogProps = {
  organizationId: string
  member: OrganizationMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function displayName(member: OrganizationMember): string {
  return member.nickname ?? member.username
}

export function OrganizationRemoveMemberDialog({
  organizationId,
  member,
  open,
  onOpenChange
}: OrganizationRemoveMemberDialogProps) {
  const removeMember = useRemoveOrganizationMember(organizationId)

  const handleRemove = async () => {
    if (!member || removeMember.isPending) return
    try {
      await removeMember.mutateAsync(member.id)
      onOpenChange(false)
    } catch {
      // mutation toast
    }
  }

  if (!member) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>移除成员</AlertDialogTitle>
          <AlertDialogDescription>
            确定将「{displayName(member)}
            」移出当前组织吗？此操作不会删除其账号或影响其在其他组织中的成员关系。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={removeMember.isPending}
            onClick={() => void handleRemove()}
          >
            移除成员
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
