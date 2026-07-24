import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema } from '@zen/shared'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@zen/ui'
import { Briefcase } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { useCreatePost, useUpdatePost } from './queries'
import { POST_GRADE_OPTIONS, slugifyPostCode } from './utils'

import type { OrganizationPost } from './api'

const postFormSchema = z.object({
  name: z.string().trim().min(1, '岗位名称不能为空').max(100),
  grade: z.string().trim().min(1, '请选择职级'),
  headcount: z.number().int().min(1, '编制至少为 1').max(999),
  description: z.string().trim().max(500).optional()
})

type PostFormValues = z.infer<typeof postFormSchema>

type PostFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  post?: OrganizationPost | null
}

export function PostFormDialog({
  open,
  onOpenChange,
  organizationId,
  post = null
}: PostFormDialogProps) {
  const isEdit = Boolean(post)
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const isPending = createPost.isPending || updatePost.isPending

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      name: '',
      grade: 'P6',
      headcount: 1,
      description: ''
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: post?.name ?? '',
      grade: post?.grade?.match(/^P[5-8]/)?.[0] ?? post?.grade ?? 'P6',
      headcount: post?.headcount ?? 1,
      description: post?.description ?? ''
    })
  }, [open, post, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && post) {
      await updatePost.mutateAsync({
        postId: post.id,
        data: {
          name: values.name,
          grade: values.grade,
          headcount: values.headcount,
          description: values.description || undefined
        }
      })
    } else {
      const code = slugifyPostCode(values.name)
      const parsed = createPostSchema.safeParse({
        code,
        name: values.name,
        organizationId,
        grade: values.grade,
        headcount: values.headcount,
        description: values.description || undefined
      })
      if (!parsed.success) {
        form.setError('name', {
          message: parsed.error.issues[0]?.message ?? '表单校验失败'
        })
        return
      }
      await createPost.mutateAsync(parsed.data)
    }
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-primary" aria-hidden />
            {isEdit ? '编辑岗位' : '添加新岗位'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新岗级、编制与职责描述' : '为当前部门创建岗位并设置编制人数'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="post-name">岗位名称</FieldLabel>
                  <Input
                    {...field}
                    id="post-name"
                    placeholder="例如：AI 产品交互专家"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="grade"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>职级定位</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                        <SelectValue placeholder="选择职级" />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_GRADE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />

              <Controller
                name="headcount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="post-headcount">编制人数</FieldLabel>
                    <Input
                      id="post-headcount"
                      type="number"
                      min={1}
                      max={999}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="post-description">岗位职责简述</FieldLabel>
                  <Textarea
                    {...field}
                    id="post-description"
                    rows={2}
                    placeholder="请简要描述该岗位的核心工作内容..."
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? '保存修改' : '确认创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
