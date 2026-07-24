import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea
} from '@zen/ui'
import { Loader2, Lock, Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useUpdateRoleMutation } from '../mutations'

import type { Role } from '@zen/shared'

type RoleEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

const editSchema = z.object({
  name: z.string().trim().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  description: z.string().trim().max(200, '描述不能超过200个字符').optional()
})

type EditFormValues = z.infer<typeof editSchema>

export function RoleEditDialog({ open, onOpenChange, role }: RoleEditDialogProps) {
  const { mutate: updateRole, isPending } = useUpdateRoleMutation()
  const locked = role.code === 'super_admin'

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: role.name,
      description: role.description ?? ''
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: role.name,
      description: role.description ?? ''
    })
  }, [open, role, form])

  const handleSubmit = (values: EditFormValues) => {
    if (locked) {
      toast.error('超级管理员角色不可编辑')
      return
    }

    updateRole(
      {
        id: role.id,
        data: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          toast.success(`已更新角色「${values.name.trim()}」的基本信息`)
          onOpenChange(false)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-primary" aria-hidden />
            编辑角色基本信息
          </DialogTitle>
          <DialogDescription>修改角色的显示名称与业务说明</DialogDescription>
        </DialogHeader>

        <form id="role-edit-form" className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role-edit-name">角色名称 *</FieldLabel>
              <FieldContent>
                <Input id="role-edit-name" disabled={locked} {...form.register('name')} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field>
              <div className="mb-1 flex items-center justify-between">
                <FieldLabel>唯一标识 Code（不可修改）</FieldLabel>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Lock className="size-3" aria-hidden />
                  系统绑定标识
                </span>
              </div>
              <FieldContent>
                <Input value={role.code} disabled className="font-mono" />
                <p className="text-[10px] text-muted-foreground">
                  Role Code 为物理策略绑定标识，创建后不可修改以防后端 API 鉴权失效
                </p>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="role-edit-description">角色描述说明</FieldLabel>
              <FieldContent>
                <Textarea
                  id="role-edit-description"
                  rows={3}
                  disabled={locked}
                  {...form.register('description')}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" form="role-edit-form" disabled={locked || isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : '保存修改'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
