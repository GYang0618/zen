import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
  Separator
} from '@zen/ui'

import { OrganizationPicker } from '@/features/system/config/components'

import { dataScopeOptions } from '../data/data'

import type { RoleDataScope } from '@zen/shared'

type RoleScopeProps = {
  value: RoleDataScope
  customOrgIds: string[]
  disabled?: boolean
  onScopeChange: (scope: RoleDataScope) => void
  onCustomOrgIdsChange: (ids: string[]) => void
}

export function RoleScope({
  value,
  customOrgIds,
  disabled = false,
  onScopeChange,
  onCustomOrgIdsChange
}: RoleScopeProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>数据访问边界</CardTitle>
        <CardDescription>
          控制该角色在查看业务报表、人员列表及敏感业务数据时的行级过滤策略（Row-Level Security）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          disabled={disabled}
          onValueChange={(next) => onScopeChange(next as RoleDataScope)}
        >
          {dataScopeOptions.map((item) => {
            const { value: key, label, description, icon: Icon } = item

            return (
              <FieldLabel key={key} htmlFor={key} className="has-[>[data-slot=field]]:rounded-2xl">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <Icon className="size-4" /> {label}
                    </FieldTitle>
                    <FieldDescription className="text-xs">{description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={key} id={key} disabled={disabled} />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>

        {value === 'custom' ? (
          <>
            <Separator className="my-4" />
            <OrganizationPicker
              value={customOrgIds}
              onChange={onCustomOrgIdsChange}
              disabled={disabled}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
