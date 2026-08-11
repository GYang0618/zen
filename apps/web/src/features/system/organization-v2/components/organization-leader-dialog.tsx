import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input
} from '@zen/ui'
import { Loader2, Mail, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { organizationUsers } from '../data/mock'
import { useOrganizations } from '../organizations-provider'
import { OrganizationLeaderSelect } from './organization-leader-select'

import type { Organization, OrganizationLeader } from '../type'

interface OrganizationLeaderDialogProps {
  currentRow: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toLeader(userId: string): OrganizationLeader | undefined {
  const user = organizationUsers.find((item) => item.id === userId)
  if (!user) return undefined
  return {
    id: user.id,
    name: user.name,
    title: user.title,
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    online: true
  }
}

export function OrganizationLeaderDialog({
  currentRow,
  open,
  onOpenChange
}: OrganizationLeaderDialogProps) {
  const { updateOrganizationLeader } = useOrganizations()
  const [leaderId, setLeaderId] = useState(currentRow.leader?.id ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const preview = organizationUsers.find((user) => user.id === leaderId)

  useEffect(() => {
    if (!open) return
    setLeaderId(currentRow.leader?.id ?? '')
    setIsSubmitting(false)
  }, [open, currentRow])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!leaderId) {
      toast.error('请选择负责人')
      return
    }

    const leader = toLeader(leaderId)
    if (!leader) {
      toast.error('未找到对应用户')
      return
    }

    setIsSubmitting(true)
    try {
      updateOrganizationLeader(currentRow.id, leader)
      toast.success(`已将「${currentRow.name}」负责人更新为 ${leader.name}`)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <UserRound className="size-5" />
              更换负责人
            </span>
          </DialogTitle>
          <DialogDescription>
            仅更换人员，电话与邮箱同步自用户资料，不可在此直接修改。
          </DialogDescription>
        </DialogHeader>

        <form id="organization-leader-form" className="space-y-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="organization-leader-user">负责人</FieldLabel>
              <FieldContent>
                <OrganizationLeaderSelect
                  id="organization-leader-user"
                  value={leaderId}
                  onValueChange={(user) => setLeaderId(user.id)}
                />
                <FieldDescription>从用户表中选择组织负责人。</FieldDescription>
              </FieldContent>
            </Field>

            {preview ? (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={preview.avatar} alt={preview.name} />
                    <AvatarFallback>{preview.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{preview.name}</p>
                    <p className="text-sm text-muted-foreground">{preview.title}</p>
                  </div>
                </div>
                <Field>
                  <FieldLabel htmlFor="organization-leader-phone">电话</FieldLabel>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organization-leader-phone"
                      value={preview.phone}
                      readOnly
                      className="pl-8"
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="organization-leader-email">邮箱</FieldLabel>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organization-leader-email"
                      value={preview.email}
                      readOnly
                      className="pl-8"
                    />
                  </div>
                </Field>
              </div>
            ) : null}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="submit" form="organization-leader-form" disabled={isSubmitting || !leaderId}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
