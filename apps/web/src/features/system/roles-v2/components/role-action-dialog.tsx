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
import { UserShield } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

interface RoleActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, '角色名称至少需要3个字符')
    .max(20, '角色名称不能超过50个字符')
    .describe('角色名称'),
  code: z
    .string()
    .trim()
    .min(2, '角色编码至少需要1个字符')
    .max(50, '角色编码不能超过50个字符')
    .describe('唯一标识 Code'),
  description: z
    .string()
    .trim()
    .max(200, '角色描述不能超过200个字符')
    .optional()
    .describe('角色描述说明')
})

export function RoleActionDialog({ open, onOpenChange }: RoleActionDialogProps) {
  const form = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: ''
    }
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <UserShield className="size-5" /> 角色
            </span>
          </DialogTitle>
          <DialogDescription>在此创建新角色、有效期、权限等信息。</DialogDescription>
        </DialogHeader>
        <form action="">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="user-username">角色名称</FieldLabel>
                  <FieldContent>
                    <Input {...field} id="user-username" placeholder="例如：运维专家" />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="user-username">唯一标识 Code</FieldLabel>
                  <FieldContent>
                    <Input {...field} id="user-username" placeholder="例如：ops_expert" />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="user-username">角色描述说明</FieldLabel>
                  <FieldContent>
                    <Textarea {...field} id="user-username" placeholder="明确该角色的职责" />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
