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
export function RoleScope() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>数据访问便边界</CardTitle>
        <CardDescription>
          控制该角色在查看业务报表、人员列表及敏感业务数据时的行级过滤策略（Row-Level Security）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup defaultValue="all" className="max-w-sm">
          <FieldLabel htmlFor="all">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>全公司数据</FieldTitle>
                <FieldDescription>无任何隔离过滤，可访问全局跨部门全量行级数据</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="all" id="all" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="department">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>本部门及下属所有子部门</FieldTitle>
                <FieldDescription>适用于部门经理与团队 Lead，能够穿透下级组织</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="department" id="department" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="department_only">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>仅本部门数据</FieldTitle>
                <FieldDescription>只能查看当前绑定部门的数据，无法穿透子部门</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="department_only" id="department_only" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="self">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>仅本人数据</FieldTitle>
                <FieldDescription>最高安全隔离级别，严格限定数据归属人为自己</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="self" id="self" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="custom">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>自定义组织白名单</FieldTitle>
                <FieldDescription>仅可访问手动勾选的组织节点数据</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="custom" id="custom" />
            </Field>
          </FieldLabel>
        </RadioGroup>

        <Separator className="my-4" />
      </CardContent>
    </Card>
  )
}
