import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { CheckCheck, Eraser, Eye, Search } from 'lucide-react'

export function PermissionMatrix() {
  const groups = [
    {
      module: '用户管理',
      permissions: [
        {
          code: 'system:user:list',
          name: '列表查看',
          description: '允许查看用户列表'
        },
        {
          code: 'system:user:create',
          name: '创建用户',
          description: '允许创建新用户账号'
        },
        {
          code: 'system:user:update',
          name: '编辑用户',
          description: '允许修改用户基本信息'
        },
        {
          code: 'system:user:delete',
          name: '删除用户',
          description: '允许删除用户账号'
        },
        {
          code: 'system:user:status',
          name: '状态变更',
          description: '允许修改用户状态'
        }
      ]
    },
    {
      module: '组织管理',
      permissions: [
        {
          code: 'system:org:tree',
          name: '查看组织',
          description: '查询组织树与成员'
        },
        {
          code: 'system:org:create',
          name: '创建组织',
          description: '允许创建组织节点'
        },
        {
          code: 'system:org:update',
          name: '编辑组织',
          description: '允许编辑组织节点'
        },
        {
          code: 'system:org:delete',
          name: '删除组织',
          description: '允许删除组织节点'
        }
      ]
    },
    {
      module: '角色管理',
      permissions: [
        {
          code: 'system:role:assign',
          name: '分配角色权限',
          description: '为角色分配权限'
        },
        {
          code: 'system:role:create',
          name: '创建角色',
          description: '创建自定义角色'
        },
        {
          code: 'system:role:delete',
          name: '删除角色',
          description: '删除自定义角色'
        },
        {
          code: 'system:role:list',
          name: '查看角色列表',
          description: '分页查询角色列表'
        },
        {
          code: 'system:role:update',
          name: '编辑角色',
          description: '更新角色信息与权限'
        }
      ]
    }
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className=" flex gap-2 items-center">
        <InputGroup className="flex-1 h-9 rounded-full">
          <InputGroupInput placeholder="全局检索权限节点，如用户、system:user:create" />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          <Button size="lg" variant="outline" aria-label="全选" className="rounded-full">
            <CheckCheck />
            全选
          </Button>
          <Button size="lg" variant="outline" aria-label="只读" className="rounded-full">
            <Eye />
            仅只读
          </Button>
          <Button size="lg" variant="outline" aria-label="清除" className="rounded-full">
            <Eraser />
            清除
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">当前已选 22 / 36项 </div>

      {groups.map((group) => (
        <Card key={group.module} className="group rounded-3xl">
          <CardHeader>
            <CardTitle>{group.module}</CardTitle>
            <CardDescription>2 / 2 项已选</CardDescription>
            <CardAction className="group-hover:opacity-100 opacity-0 transition-opacity duration-300">
              <div className="flex">
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon-sm" aria-label="全选">
                      <CheckCheck />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>全选</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon-sm" aria-label="只读">
                      <Eye />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>只读</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon-sm" aria-label="清除">
                      <Eraser />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>清除</TooltipContent>
                </Tooltip>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid grid-cols-1 gap-4 @xl/content:grid-cols-2">
              {group.permissions.map((item) => (
                <FieldLabel
                  key={item.code}
                  htmlFor={item.code}
                  className="min-w-0 has-[>[data-slot=field]]:rounded-2xl"
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>
                        {item.name}
                        <Badge variant="ghost" className="text-xs text-muted-foreground ">
                          {item.code}
                        </Badge>
                      </FieldTitle>
                      <FieldDescription>{item.description}</FieldDescription>
                    </FieldContent>
                    <Switch id={item.code} />
                  </Field>
                </FieldLabel>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
