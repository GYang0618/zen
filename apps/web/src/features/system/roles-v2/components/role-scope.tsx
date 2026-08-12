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
import { Building2, Database, FolderTree, Settings2, UserRound } from 'lucide-react'
import { useState } from 'react'

import { organizations } from '@/features/system/organization-v2/data/mock'

import { RoleScopeOrganizationTree } from './role-scope-organization-tree'

import type { LucideIcon } from 'lucide-react'

type DataScopeKey = 'all' | 'department' | 'department_only' | 'self' | 'custom'

interface DataScopeOption {
  key: DataScopeKey
  name: string
  description: string
  icon: LucideIcon
}

const dataScopeOptions: DataScopeOption[] = [
  {
    key: 'all',
    name: '全部数据',
    description: '无任何隔离过滤，可访问全局跨部门全量行级数据',
    icon: Database
  },
  {
    key: 'department',
    name: '本部门及下属所有子部门数据',
    description: '适用于部门经理与团队 Lead，能够穿透下级组织',
    icon: FolderTree
  },
  {
    key: 'department_only',
    name: '仅本部门数据',
    description: '只能查看当前绑定部门的数据，无法穿透子部门',
    icon: Building2
  },
  {
    key: 'self',
    name: '仅本人数据',
    description: '最高安全隔离级别，严格限定数据归属人为自己',
    icon: UserRound
  },
  {
    key: 'custom',
    name: '自定义数据',
    description: '仅可访问手动勾选的组织节点数据',
    icon: Settings2
  }
]

export function RoleScope() {
  const [dataScope, setDataScope] = useState<DataScopeKey>('all')
  const [customOrgIds, setCustomOrgIds] = useState<string[]>([])

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
          value={dataScope}
          onValueChange={(value) => setDataScope(value as DataScopeKey)}
        >
          {dataScopeOptions.map((item) => {
            const { key, name, description, icon: Icon } = item

            return (
              <FieldLabel key={key} htmlFor={key} className="has-[>[data-slot=field]]:rounded-2xl">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <Icon className="size-4" /> {name}
                    </FieldTitle>
                    <FieldDescription className="text-xs"> {description} </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={key} id={key} />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>

        {dataScope === 'custom' ? (
          <>
            <Separator className="my-4" />
            <RoleScopeOrganizationTree
              tree={organizations}
              value={customOrgIds}
              onChange={setCustomOrgIds}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
