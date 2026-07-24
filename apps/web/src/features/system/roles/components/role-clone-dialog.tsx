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
import { Copy, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { dataScopeConfig } from '../data/data'
import { useCloneRoleMutation } from '../mutations'

import type { Role } from '@zen/shared'

type RoleCloneDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  onCloned?: (roleId: string) => void
}

const cloneSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, '角色编码至少需要2个字符')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '角色编码仅支持小写字母、数字和下划线，且以字母开头'),
  name: z.string().trim().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  description: z.string().trim().max(200, '描述不能超过200个字符').optional()
})

type CloneFormValues = z.infer<typeof cloneSchema>

function buildCopyCode(code: string) {
  const base = code.slice(0, 40)
  const suffix = `_copy`
  return `${base}${suffix}`.slice(0, 50)
}

export function RoleCloneDialog({ open, onOpenChange, role, onCloned }: RoleCloneDialogProps) {
  const { mutate: cloneRole, isPending } = useCloneRoleMutation()

  const form = useForm<CloneFormValues>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      name: `${role.name} - 副本`.slice(0, 50),
      code: buildCopyCode(role.code),
      description: `克隆自模板「${role.name}」。${role.description ?? ''}`.slice(0, 200)
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: `${role.name} - 副本`.slice(0, 50),
      code: buildCopyCode(role.code),
      description: `克隆自模板「${role.name}」。${role.description ?? ''}`.slice(0, 200)
    })
  }, [open, role, form])

  const handleSubmit = (values: CloneFormValues) => {
    cloneRole(
      {
        id: role.id,
        data: {
          code: values.code.trim(),
          name: values.name.trim(),
          description: values.description?.trim() || undefined
        }
      },
      {
        onSuccess: (created) => {
          toast.success(`已成功基于「${role.name}」克隆生成新角色「${created.name}」`)
          onOpenChange(false)
          onCloned?.(created.id)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-4 text-primary" aria-hidden />
            克隆角色策略
          </DialogTitle>
          <DialogDescription>将深拷贝模板「{role.name}」的全量权限与配置</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/60 p-3 text-xs">
          <div className="flex items-center justify-between font-medium text-foreground">
            <span>继承模板信息：</span>
            <span className="font-mono text-muted-foreground">{role.code}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <span>
              功能权限: <strong className="text-foreground">{role.permissions.length} 项</strong>
            </span>
            <span>
              数据作用域:{' '}
              <strong className="text-foreground">{dataScopeConfig[role.dataScope].label}</strong>
            </span>
          </div>
        </div>

        <form id="role-clone-form" className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="clone-name">新角色名称 *</FieldLabel>
              <FieldContent>
                <Input id="clone-name" {...form.register('name')} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="clone-code">唯一标识 Code *</FieldLabel>
              <FieldContent>
                <Input id="clone-code" className="font-mono" {...form.register('code')} />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="clone-description">新角色描述说明</FieldLabel>
              <FieldContent>
                <Textarea id="clone-description" rows={2} {...form.register('description')} />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" form="role-clone-form" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : '确认克隆生成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
