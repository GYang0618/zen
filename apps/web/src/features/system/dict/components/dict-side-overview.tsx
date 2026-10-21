import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@zen/ui'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

import { useWorkspacesQuery } from '../queries'
import { getDictionaryBasicFieldValidationError } from '../validation'

import type { DictKind } from '@zen/shared'
import type { DictionaryBasicField } from '../validation'

export interface DictBasicInfoValues {
  name: string
  code: string
  folderId: string
  kind: DictKind
  description: string
}

interface DictSideOverviewProps {
  values: DictBasicInfoValues
  onChange: (patch: Partial<DictBasicInfoValues>) => void
  isEditing: boolean
  isNew?: boolean
  errors?: Partial<Record<keyof DictBasicInfoValues, string>>
  className?: string
}

const KIND_OPTIONS = [
  { label: '业务', value: 'business' },
  { label: '系统', value: 'system' }
]

export function DictSideOverview({
  values,
  onChange,
  isEditing,
  isNew = false,
  errors = {},
  className
}: DictSideOverviewProps) {
  const { data: workspacesData } = useWorkspacesQuery()
  const workspaces = workspacesData?.workspaces ?? []

  const currentWorkspace = workspaces.find((w) => w.id === values.folderId)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceQuery, setWorkspaceQuery] = useState('')
  const [validatedFields, setValidatedFields] = useState<Set<DictionaryBasicField>>(() => new Set())
  const [localErrors, setLocalErrors] = useState<Partial<Record<DictionaryBasicField, string>>>({})

  const validateField = (field: DictionaryBasicField, nextValues = values) => {
    setValidatedFields((current) => new Set(current).add(field))
    setLocalErrors((current) => ({
      ...current,
      [field]: getDictionaryBasicFieldValidationError(nextValues, field)
    }))
  }

  const updateField = (patch: Partial<DictBasicInfoValues>) => {
    onChange(patch)
    const nextValues = { ...values, ...patch }
    for (const field of Object.keys(patch) as DictionaryBasicField[]) {
      if (validatedFields.has(field)) validateField(field, nextValues)
    }
  }

  const fieldError = (field: DictionaryBasicField) => errors[field] ?? localErrors[field]

  return (
    <div
      className={cn(
        'bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-90 @5xl/content:self-start',
        className
      )}
    >
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>字典的基本信息与全局标识。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dict-name">
                名称 {isEditing && <span className="text-destructive">*</span>}
              </FieldLabel>
              {!isEditing && !isNew ? (
                <OverviewValue value={values.name} />
              ) : (
                <div>
                  <Input
                    id="dict-name"
                    autoComplete="off"
                    value={values.name}
                    maxLength={80}
                    aria-invalid={Boolean(fieldError('name'))}
                    onBlur={() => validateField('name')}
                    onChange={(e) => updateField({ name: e.target.value })}
                    placeholder="如：用户状态"
                  />
                  {fieldError('name') && (
                    <p className="text-xs text-destructive mt-1">{fieldError('name')}</p>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="dict-code">
                唯一标识 Code {isEditing && isNew && <span className="text-destructive">*</span>}
              </FieldLabel>
              {!isEditing && !isNew ? (
                <OverviewValue value={values.code} className="font-mono" />
              ) : isEditing && isNew ? (
                <div>
                  <Input
                    id="dict-code"
                    autoComplete="off"
                    value={values.code}
                    maxLength={80}
                    aria-invalid={Boolean(fieldError('code'))}
                    onBlur={() => validateField('code')}
                    onChange={(e) => updateField({ code: e.target.value })}
                    placeholder="如：user_status"
                    className="font-mono"
                  />
                  {fieldError('code') && (
                    <p className="text-xs text-destructive mt-1">{fieldError('code')}</p>
                  )}
                </div>
              ) : (
                <Input
                  id="dict-code"
                  readOnly
                  value={values.code}
                  className="bg-muted/30 focus-visible:ring-0 font-mono"
                />
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="dict-description">描述说明</FieldLabel>
              {!isEditing && !isNew ? (
                <OverviewValue value={values.description || '暂无描述'} multiline />
              ) : (
                <div>
                  <Textarea
                    id="dict-description"
                    value={values.description}
                    maxLength={200}
                    aria-invalid={Boolean(fieldError('description'))}
                    onBlur={() => validateField('description')}
                    onChange={(e) => updateField({ description: e.target.value })}
                    placeholder="简要描述字典的用途..."
                    className="resize-none"
                    rows={3}
                  />
                  {fieldError('description') && (
                    <p className="text-xs text-destructive mt-1">{fieldError('description')}</p>
                  )}
                </div>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* 属性 */}
      <Card>
        <CardHeader>
          <CardTitle>属性</CardTitle>
          <CardDescription>字典的归属与性质。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dict-folder">
                所属空间 {isEditing && <span className="text-destructive">*</span>}
              </FieldLabel>
              {!isEditing && !isNew ? (
                <OverviewValue value={currentWorkspace?.name || '未分配空间'} />
              ) : (
                <div>
                  <Popover
                    open={workspaceOpen}
                    onOpenChange={(open) => {
                      setWorkspaceOpen(open)
                      if (!open) setWorkspaceQuery('')
                    }}
                  >
                    <PopoverTrigger
                      render={
                        <Button
                          id="dict-folder"
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={workspaceOpen}
                          aria-invalid={Boolean(fieldError('folderId'))}
                          className="w-full justify-between font-normal"
                          onBlur={() => validateField('folderId')}
                        />
                      }
                    >
                      <span
                        className={currentWorkspace ? 'truncate' : 'truncate text-muted-foreground'}
                      >
                        {currentWorkspace?.name ?? '请选择所属空间'}
                      </span>
                      <ChevronsUpDown data-icon="inline-end" className="text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent className="w-(--anchor-width) p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="搜索空间"
                          value={workspaceQuery}
                          onValueChange={setWorkspaceQuery}
                        />
                        <CommandList>
                          <CommandEmpty>没有找到匹配空间</CommandEmpty>
                          <CommandGroup>
                            {workspaces.map((space) => (
                              <CommandItem
                                key={space.id}
                                value={space.name}
                                data-checked={values.folderId === space.id || undefined}
                                onSelect={() => {
                                  updateField({ folderId: space.id })
                                  setWorkspaceOpen(false)
                                  setWorkspaceQuery('')
                                }}
                              >
                                <span className="min-w-0 flex-1 truncate">{space.name}</span>
                                {values.folderId === space.id && <Check className="size-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {fieldError('folderId') && (
                    <p className="text-xs text-destructive mt-1">{fieldError('folderId')}</p>
                  )}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="dict-kind">
                字典性质（code） {isEditing && <span className="text-destructive">*</span>}
              </FieldLabel>
              {!isEditing && !isNew ? (
                <OverviewValue value={values.kind === 'system' ? '系统' : '业务'} />
              ) : (
                <Select
                  value={values.kind}
                  onValueChange={(val) => onChange({ kind: (val ?? 'business') as DictKind })}
                >
                  <SelectTrigger id="dict-kind" className="w-full">
                    <SelectValue placeholder="请选择性质" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {KIND_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}

function OverviewValue({
  value,
  className,
  multiline = false
}: {
  value: string
  className?: string
  multiline?: boolean
}) {
  return (
    <p
      className={cn(
        'text-sm font-medium break-all',
        multiline && 'min-h-14 whitespace-pre-wrap rounded-lg bg-muted/40 px-2.5 py-2',
        className
      )}
    >
      {value}
    </p>
  )
}
