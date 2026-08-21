import {
  applyOrganizationTypeTemplate,
  buildOrganizationTypeCatalog,
  matchOrganizationTypeTemplateId,
  ORGANIZATION_TYPE_DESCRIPTIONS,
  ORGANIZATION_TYPE_TEMPLATES,
  PermissionCode
} from '@zen/shared'
import {
  Button,
  cn,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch
} from '@zen/ui'
import { Layers, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { organizationIconConfig } from '../data/data'
import { useOrganizationTypeCatalog, useUpdateOrganizationTypeCatalog } from '../queries'

import type { OrganizationTypeTemplateId, OrganizationTypeValue } from '@zen/shared'

type DraftItem = {
  type: OrganizationTypeValue
  label: string
  enabled: boolean
  required: boolean
}

type OrganizationTypeCatalogSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toDraft(catalog: ReturnType<typeof buildOrganizationTypeCatalog>): DraftItem[] {
  return catalog.items.map((item) => ({
    type: item.type,
    label: item.label,
    enabled: item.enabled,
    required: item.required
  }))
}

export function OrganizationTypeCatalogSheet({
  open,
  onOpenChange
}: OrganizationTypeCatalogSheetProps) {
  const { catalog, inUseTypes } = useOrganizationTypeCatalog()
  const updateCatalog = useUpdateOrganizationTypeCatalog()
  const [draft, setDraft] = useState<DraftItem[]>(() => toDraft(catalog))
  const [pendingTemplateId, setPendingTemplateId] = useState<OrganizationTypeTemplateId>()

  useEffect(() => {
    if (open) setDraft(toDraft(catalog))
  }, [catalog, open])

  const selectedTemplateId = useMemo(
    () =>
      matchOrganizationTypeTemplateId(
        draft.filter((item) => item.enabled).map((item) => item.type)
      ),
    [draft]
  )
  const inUseTypeSet = useMemo(() => new Set(inUseTypes), [inUseTypes])

  const handleSave = async () => {
    await updateCatalog.mutateAsync({
      items: draft.map((item) => ({
        type: item.type,
        enabled: item.enabled,
        label: item.label.trim()
      }))
    })
    onOpenChange(false)
  }

  const applyTemplate = (templateId: OrganizationTypeTemplateId) => {
    setDraft(toDraft(buildOrganizationTypeCatalog(applyOrganizationTypeTemplate(templateId))))
    setPendingTemplateId(undefined)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>
              <span className="flex items-center gap-2">
                <Layers className="size-5" />
                组织类型
              </span>
            </SheetTitle>
            <SheetDescription>
              选择开通模板，再按企业习惯改名。关闭某类型后仍保留已有节点，只是不能再新建。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel>开通模板</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ORGANIZATION_TYPE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors hover:bg-muted/60',
                        selectedTemplateId === template.id && 'border-primary bg-muted'
                      )}
                      onClick={() => setPendingTemplateId(template.id)}
                    >
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                    </button>
                  ))}
                </div>
              </Field>
            </FieldGroup>

            <FieldGroup className="gap-3">
              {draft.map((item) => {
                const config = organizationIconConfig[item.type]
                const Icon = config?.icon
                const inUse = inUseTypeSet.has(item.type)
                return (
                  <Field key={item.type} className="rounded-lg border p-3" orientation="horizontal">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {Icon ? (
                        <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className={cn('size-4', config.defaultColor)} />
                        </div>
                      ) : null}
                      <FieldGroup className="min-w-0 flex-1 gap-1">
                        <FieldLabel htmlFor={`org-type-label-${item.type}`} className="sr-only">
                          {item.type}名称
                        </FieldLabel>
                        <Input
                          id={`org-type-label-${item.type}`}
                          value={item.label}
                          maxLength={20}
                          onChange={(event) =>
                            setDraft((current) =>
                              current.map((entry) =>
                                entry.type === item.type
                                  ? { ...entry, label: event.target.value }
                                  : entry
                              )
                            )
                          }
                        />
                        <FieldDescription>
                          {ORGANIZATION_TYPE_DESCRIPTIONS[item.type]}
                          {inUse ? ' · 使用中' : ''}
                          {item.required ? ' · 基础类型不可关闭' : ''}
                        </FieldDescription>
                      </FieldGroup>
                    </div>
                    <Switch
                      checked={item.enabled}
                      disabled={item.required}
                      aria-label={`启用${item.label || item.type}`}
                      onCheckedChange={(enabled) =>
                        setDraft((current) =>
                          current.map((entry) =>
                            entry.type === item.type ? { ...entry, enabled } : entry
                          )
                        )
                      }
                    />
                  </Field>
                )
              })}
            </FieldGroup>
          </div>

          <SheetFooter className="border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Can permission={PermissionCode.ORG_UPDATE}>
              <Button
                type="button"
                disabled={updateCatalog.isPending}
                onClick={() => void handleSave()}
              >
                {updateCatalog.isPending ? <Loader2 className="animate-spin" /> : null}
                保存
              </Button>
            </Can>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={pendingTemplateId !== undefined}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingTemplateId(undefined)
        }}
        title="应用开通模板？"
        desc="将按该模板重置启用状态和类型名称。已有组织节点不会删除，关闭的类型只是不能再新建。"
        cancelBtnText="取消"
        confirmText="应用模板"
        handleConfirm={() => {
          if (pendingTemplateId) applyTemplate(pendingTemplateId)
        }}
      />
    </>
  )
}
