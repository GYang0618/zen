import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@zen/ui'

export function RoleFields() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['用户名', '手机号', '身份证'].map((filed) => (
              <div key={filed} className="p-4 grid grid-cols-3 gap-7 border rounded-2xl">
                <Field>
                  <FieldLabel htmlFor="field">字段</FieldLabel>
                  <Input defaultValue={filed} readOnly />
                </Field>
                <Field>
                  <FieldLabel htmlFor="sensitivity">敏感级别</FieldLabel>
                  <Select defaultValue="public">
                    <SelectTrigger>
                      <SelectValue placeholder="选择敏感级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">公开</SelectItem>
                      <SelectItem value="sensitive">脱敏</SelectItem>
                      <SelectItem value="hidden">隐藏</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="permission">权限</FieldLabel>
                  <Select defaultValue="readonly">
                    <SelectTrigger>
                      <SelectValue placeholder="选择敏感级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="readonly">只读</SelectItem>
                      <SelectItem value="editable">编辑</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
