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
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useOrganizations } from '../organizations-provider'
import { OrganizationLeaderSelect } from './organization-leader-select'

import type { Organization, OrganizationUserOption } from '../type'

interface OrganizationLeaderDialogProps {
  currentRow: Organization
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toUserOption(leader: NonNullable<Organization['leader']>): OrganizationUserOption {
  return {
    id: leader.id,
    name: leader.name,
    title: leader.title ?? '',
    avatar: leader.avatar ?? '',
    email: leader.email ?? '',
    phone: leader.phone ?? ''
  }
}

export function OrganizationLeaderDialog({
  currentRow,
  open,
  onOpenChange
}: OrganizationLeaderDialogProps) {
  const { updateOrganizationLeader } = useOrganizations()
  const [leaderId, setLeaderId] = useState(currentRow.leader?.id ?? '')
  const [preview, setPreview] = useState<OrganizationUserOption | undefined>(
    currentRow.leader ? toUserOption(currentRow.leader) : undefined
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedUser = useMemo(
    () => (currentRow.leader ? toUserOption(currentRow.leader) : undefined),
    [currentRow.leader]
  )

  useEffect(() => {
    if (!open) return
    setLeaderId(currentRow.leader?.id ?? '')
    setPreview(currentRow.leader ? toUserOption(currentRow.leader) : undefined)
    setIsSubmitting(false)
  }, [open, currentRow])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!leaderId) {
      toast.error('请选择负责人')
      return
    }

    setIsSubmitting(true)
    try {
      await updateOrganizationLeader(currentRow.id, leaderId)
      onOpenChange(false)
    } catch {
      // mutation toast
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
                  selectedUser={preview ?? selectedUser}
                  onValueChange={(user) => {
                    setLeaderId(user.id)
                    setPreview(user)
                  }}
                />
                <FieldDescription>从用户表中选择组织负责人。</FieldDescription>
              </FieldContent>
            </Field>

            {preview ? (
              <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={preview.avatar || undefined} alt={preview.name} />
                    <AvatarFallback>{preview.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{preview.name}</p>
                    <p className="text-sm text-muted-foreground">{preview.title || '—'}</p>
                  </div>
                </div>
                <Field>
                  <FieldLabel htmlFor="organization-leader-phone">电话</FieldLabel>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organization-leader-phone"
                      value={preview.phone || '—'}
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
                      value={preview.email || '—'}
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
          <Button
            type="submit"
            form="organization-leader-form"
            disabled={isSubmitting || !leaderId}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
