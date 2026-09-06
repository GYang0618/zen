import { useForm } from '@tanstack/react-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FormActions,
  Textarea
} from '@zen/ui'
import { z } from 'zod'

import { useUpdatePluginConfig } from './queries'

import type { PluginListItem } from './api'

const configSchema = z.object({
  configText: z.string().superRefine((value, context) => {
    try {
      const parsed = JSON.parse(value) as unknown
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        context.addIssue({ code: 'custom', message: '配置必须是 JSON 对象' })
      }
    } catch {
      context.addIssue({ code: 'custom', message: 'JSON 格式无效' })
    }
  })
})

interface PluginConfigDialogProps {
  plugin: PluginListItem | null
  onOpenChange: (open: boolean) => void
}

export function PluginConfigDialog({ plugin, onOpenChange }: PluginConfigDialogProps) {
  const updateConfig = useUpdatePluginConfig()
  const form = useForm({
    defaultValues: {
      configText: JSON.stringify(plugin?.config ?? {}, null, 2)
    },
    validators: { onChange: configSchema, onSubmit: configSchema },
    onSubmit: async ({ value }) => {
      if (!plugin) return
      const parsed = JSON.parse(value.configText) as Record<string, unknown>
      await updateConfig.mutateAsync({ id: plugin.id, config: parsed })
      onOpenChange(false)
    }
  })

  return (
    <Dialog open={Boolean(plugin)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>插件配置 · {plugin?.name}</DialogTitle>
          <DialogDescription>以 JSON 维护插件 Feature Flag，保存后立即生效</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="configText">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="plugin-config">JSON 配置</FieldLabel>
                  <Textarea
                    id="plugin-config"
                    className="min-h-40 font-mono text-sm"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-label="插件 JSON 配置"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )}
            </form.Field>
            <FormActions>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateConfig.isPending || !plugin}>
                保存
              </Button>
            </FormActions>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
