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
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCreateRoleMutation } from '../mutations'

type RolesActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (roleId: string) => void
}

const roleFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, '角色编码至少需要2个字符')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '角色编码仅支持小写字母、数字和下划线，且以字母开头'),
  name: z.string().trim().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  description: z.string().trim().max(200, '描述不能超过200个字符').optional()
})

type RoleFormValues = z.infer<typeof roleFormSchema>

const defaultValues: RoleFormValues = {
  code: '',
  name: '',
  description: ''
}

export function RolesActionDialog({ open, onOpenChange, onCreated }: RolesActionDialogProps) {
  const { mutate: createRole, isPending, error } = useCreateRoleMutation()

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues
  })

  useEffect(() => {
    if (!open) return
    form.reset(defaultValues)
  }, [open, form])

  const handleSubmit = (values: RoleFormValues) => {
    createRole(
      {
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        dataScope: 'self',
        permissionCodes: []
      },
      {
        onSuccess: (created) => {
          toast.success(`成功新建角色「${created.name}」`)
          onOpenChange(false)
          form.reset(defaultValues)
          onCreated?.(created.id)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建角色定义</DialogTitle>
          <DialogDescription>
            先创建角色元数据，随后可在右侧配置权限矩阵与数据边界。
          </DialogDescription>
        </DialogHeader>

        <form
          id="role-create-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role-name">角色名称 *</FieldLabel>
              <FieldContent>
                <Input id="role-name" placeholder="例如: 极客运维专家" {...form.register('name')} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="role-code">唯一标识 Code *</FieldLabel>
              <FieldContent>
                <Input
                  id="role-code"
                  className="font-mono"
                  placeholder="例如: ops_expert"
                  {...form.register('code')}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="role-description">角色描述说明</FieldLabel>
              <FieldContent>
                <Textarea
                  id="role-description"
                  rows={3}
                  placeholder="明确该角色对应的团队岗位职责与权限边界..."
                  {...form.register('description')}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>
          </FieldGroup>

          {error ? <p className="text-sm text-destructive">{error.message || '创建失败'}</p> : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" form="role-create-form" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : '创建角色'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
