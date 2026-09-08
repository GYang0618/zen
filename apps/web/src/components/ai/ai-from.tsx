import { useForm } from '@tanstack/react-form'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea
} from '@zen/ui'
import { z } from 'zod'

const formSchema = z.object({
  title: z.string().min(5, '标题至少5个字符').max(32, '标题最多32个字符'),
  description: z.string().min(20, '描述至少20个字符').max(100, '描述最多100个字符')
})

type FormSchema = z.infer<typeof formSchema>

export function AIForm() {
  const form = useForm({
    defaultValues: {
      title: '',
      description: ''
    } as FormSchema,
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(formSchema.parse(value))
    }
  })

  function onSubmit(data: FormSchema) {
    console.log('🚀 ~ onSubmit ~ data:', data)
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Bug反馈</CardTitle>
        <CardDescription>反馈你遇到的问题</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="feedback-form"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="title">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="feedback-form-title">标题</FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    id="feedback-form-title"
                    aria-invalid={!field.state.meta.isValid}
                    placeholder="如：手机上的登录按钮无法正常工作"
                    autoComplete="off"
                  />
                  {!field.state.meta.isValid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="feedback-form-description">描述</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="feedback-form-description"
                      placeholder="如：我的手机登录按钮有问题。"
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={!field.state.meta.isValid}
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.state.value.length}/100 字符
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>请列出重现步骤、预期行为和实际发生的情况。</FieldDescription>
                  {!field.state.meta.isValid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field className="flex justify-end" orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            重置
          </Button>
          <Button type="submit" form="feedback-form">
            提交
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
