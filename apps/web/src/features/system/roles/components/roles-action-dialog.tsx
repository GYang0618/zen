import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@zen/ui'

import type { Role } from '@zen/shared'

type RoleActionDialogProps = {
  currentRow?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function RolesActionDialog({ currentRow, open, onOpenChange }: RoleActionDialogProps) {
  const isEdit = !!currentRow
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        onOpenChange(state)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>角色</DialogTitle>
          <DialogDescription>
            {isEdit ? '在此更新角色信息。' : '在此创建新角色。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="submit" form="role-form">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
