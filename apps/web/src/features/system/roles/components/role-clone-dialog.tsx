import { useForm } from '@tanstack/react-form'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Calendar,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea
} from '@zen/ui'
import { CalendarIcon, Copy, Info, Loader2, ShieldCheck, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCloneRoleMutation } from '@/features/system/roles/mutations'

import type { RoleListItem } from '@zen/shared'

interface RoleCloneDialogProps {
  currentRow: RoleListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EXPIRED_AT_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const TODAY = (() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})()

const cloneFormSchema = z.object({
  name: z.string().trim().min(1, 'è§è²åç§°ä¸è½ä¸ºç©º').max(50, 'è§è²åç§°ä¸è½è¶è¿50ä¸ªå­ç¬¦'),
  code: z
    .string()
    .trim()
    .min(2, 'è§è²ç¼ç è³å°éè¦2ä¸ªå­ç¬¦')
    .max(50, 'è§è²ç¼ç ä¸è½è¶è¿50ä¸ªå­ç¬¦')
    .regex(/^[a-z][a-z0-9_]*$/, 'è§è²ç¼ç ä»æ¯æå°åå­æ¯ãæ°å­åä¸åçº¿ï¼ä¸ä»¥å­æ¯å¼å¤´'),
  description: z.string().trim().max(200, 'è§è²æè¿°ä¸è½è¶è¿200ä¸ªå­ç¬¦'),
  expiresAt: z.date().nullable()
})

type CloneFormValues = z.infer<typeof cloneFormSchema>

function formatExpiredAt(date: Date | null): string | null {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function suggestCloneCode(sourceCode: string): string {
  return `${sourceCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')}_copy`
}

function buildDefaultValues(source: RoleListItem): CloneFormValues {
  return {
    name: `${source.name} å¯æ¬`,
    code: suggestCloneCode(source.code),
    description: source.description ?? '',
    expiresAt: null
  }
}

export function RoleCloneDialog({ currentRow, open, onOpenChange }: RoleCloneDialogProps) {
  const [expiredAtOpen, setExpiredAtOpen] = useState(false)
  const { mutate: cloneRole, isPending } = useCloneRoleMutation()

  const form = useForm({
    defaultValues: buildDefaultValues(currentRow) as CloneFormValues,
    validators: { onChange: cloneFormSchema },
    onSubmit: async ({ value }) => {
      await handleSubmit(cloneFormSchema.parse(value))
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset(buildDefaultValues(currentRow))
    setExpiredAtOpen(false)
  }, [open, currentRow, form])

  const handleSubmit = (values: CloneFormValues) => {
    if (values.expiresAt && values.expiresAt < TODAY) {
      form.setFieldMeta('expiresAt', (meta) => ({
        ...meta,
        errorMap: {
          ...meta.errorMap,
          onSubmit: [{ code: 'custom', path: [], message: 'è¿ææ¶é´ä¸è½æ©äºä»å¤©' }]
        }
      }))
      return
    }

    cloneRole(
      {
        id: currentRow.id,
        data: {
          name: values.name.trim(),
          code: values.code.trim(),
          description: values.description.trim() || undefined,
          expiresAt: formatExpiredAt(values.expiresAt)
        }
      },
      {
        onSuccess: (cloned) => {
          toast.success(`å·²åºäºã${currentRow.name}ãåéåºæ°è§è²ã${cloned.name}ã`)
          onOpenChange(false)
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'åéå¤±è´¥'
          if (message.includes('ç¼ç ') || message.includes('å·²å­å¨')) {
            form.setFieldMeta('code', (meta) => ({
              ...meta,
              errorMap: {
                ...meta.errorMap,
                onSubmit: [{ code: 'custom', path: [], message: 'è§è²ç¼ç å·²å­å¨' }]
              }
            }))
            return
          }
          toast.error(message)
        }
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Copy className="size-5" /> åéè§è²æééç½®
            </span>
          </DialogTitle>
          <DialogDescription>
            åºäºã{currentRow.name}ãåå»ºä¸ä¸ªæ°è§è²ï¼å¯å¨ä¿å­åè°æ´åç§°ä¸ç¼ç ã
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info />
          <AlertTitle className="flex items-center gap-2">
            å°å¤å¶ä»¥ä¸éç½®
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" />
              {currentRow.permissionCount} é¡¹æé
            </Badge>
          </AlertTitle>
          <AlertDescription className="flex items-center gap-1.5">
            <UserX className="size-3.5" /> ä¸åå«è¯¥è§è²å½åå³èçæåï¼åéåééæ°åéã
          </AlertDescription>
        </Alert>

        <form
          id="role-clone-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-name">æ°è§è²åç§°</FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="clone-role-name"
                      placeholder="ä¾å¦ï¼è¿ç»´ä¸å®¶ å¯æ¬"
                      aria-invalid={!field.state.meta.isValid}
                      autoComplete="off"
                      autoFocus
                    />
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="code">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-code">å¯ä¸æ è¯ Code</FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="clone-role-code"
                      className="font-mono"
                      placeholder="ä¾å¦ï¼ops_expert_copy"
                      aria-invalid={!field.state.meta.isValid}
                      autoComplete="off"
                    />
                    <FieldDescription>å·²æ ¹æ®æ¥æºè§è²èªå¨çæï¼å¯èªè¡ä¿®æ¹ã</FieldDescription>
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="expiresAt">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-expired-at">è¿ææ¶é´</FieldLabel>
                  <FieldContent>
                    <Popover open={expiredAtOpen} onOpenChange={setExpiredAtOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="clone-role-expired-at"
                            type="button"
                            variant="outline"
                            data-empty={!field.state.value}
                            aria-invalid={!field.state.meta.isValid}
                            className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
                          />
                        }
                      >
                        {field.state.value
                          ? EXPIRED_AT_FORMATTER.format(field.state.value)
                          : 'çç©ºè¡¨ç¤ºé¿æææ'}
                        <CalendarIcon data-icon="inline-end" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.state.value ?? undefined}
                          onSelect={(date) => {
                            field.handleChange(date ?? null)
                            setExpiredAtOpen(false)
                          }}
                          captionLayout="dropdown"
                          startMonth={TODAY}
                          disabled={{ before: TODAY }}
                          defaultMonth={field.state.value ?? TODAY}
                          autoFocus
                        />
                        {field.state.value ? (
                          <div className="border-t p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                field.handleChange(null)
                                setExpiredAtOpen(false)
                              }}
                            >
                              æ¸é¤ï¼é¿æææï¼
                            </Button>
                          </div>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-description">è§è²æè¿°è¯´æ</FieldLabel>
                  <FieldContent>
                    <Textarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="clone-role-description"
                      rows={3}
                      placeholder="æç¡®è¯¥è§è²çèè´£"
                      aria-invalid={!field.state.meta.isValid}
                    />
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            åæ¶
          </Button>
          <Button type="submit" form="role-clone-form" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Copy />}
            åé
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
