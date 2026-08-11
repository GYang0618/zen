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
import { useMemo, useState } from 'react'

type PermissionItem = {
  code: string
  name: string
  description: string
}

type PermissionGroup = {
  module: string
  permissions: PermissionItem[]
}

type PermissionPreset = 'all' | 'readonly' | 'none'

const PERMISSION_GROUPS: PermissionGroup[] = [
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

/** 只读权限：code 以 read/list/view/get/tree 结尾 */
function isReadonlyCode(code: string) {
  return /:(read|list|view|get|tree)$/i.test(code) || /_read$/i.test(code)
}

function applyModulePreset(
  current: string[],
  moduleCodes: string[],
  preset: PermissionPreset
): string[] {
  const moduleSet = new Set(moduleCodes)
  const withoutModule = current.filter((code) => !moduleSet.has(code))

  if (preset === 'none') return withoutModule
  if (preset === 'all') return [...new Set([...withoutModule, ...moduleCodes])]

  const readonlyCodes = moduleCodes.filter(isReadonlyCode)
  return [...new Set([...withoutModule, ...readonlyCodes])]
}

export function PermissionMatrix() {
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const totalCount = useMemo(
    () => PERMISSION_GROUPS.reduce((sum, group) => sum + group.permissions.length, 0),
    []
  )

  const filteredGroups = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return PERMISSION_GROUPS

    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(query) ||
          permission.code.toLowerCase().includes(query) ||
          permission.description.toLowerCase().includes(query) ||
          group.module.toLowerCase().includes(query)
      )
    })).filter((group) => group.permissions.length > 0)
  }, [keyword])

  const togglePermission = (code: string, checked: boolean) => {
    if (checked) {
      setSelected((prev) => (prev.includes(code) ? prev : [...prev, code]))
      return
    }
    setSelected((prev) => prev.filter((item) => item !== code))
  }

  const applyGlobalPreset = (preset: PermissionPreset) => {
    if (preset === 'all') {
      setSelected(PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.code)))
      return
    }
    if (preset === 'readonly') {
      setSelected(
        PERMISSION_GROUPS.flatMap((group) =>
          group.permissions.filter((item) => isReadonlyCode(item.code)).map((item) => item.code)
        )
      )
      return
    }
    setSelected([])
  }

  const applyLocalPreset = (moduleCodes: string[], preset: PermissionPreset) => {
    setSelected((prev) => applyModulePreset(prev, moduleCodes, preset))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <InputGroup className="h-9 flex-1 rounded-full">
          <InputGroupInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="全局检索权限节点，如用户、system:user:create"
            aria-label="筛选权限"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-label="全选"
            className="rounded-full"
            onClick={() => applyGlobalPreset('all')}
          >
            <CheckCheck />
            全选
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-label="仅只读"
            className="rounded-full"
            title="仅保留查看/读取类权限"
            onClick={() => applyGlobalPreset('readonly')}
          >
            <Eye />
            仅只读
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-label="清除"
            className="rounded-full"
            onClick={() => applyGlobalPreset('none')}
          >
            <Eraser />
            清除
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        当前已选 {selected.length} / {totalCount} 项
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          没有匹配的权限点
        </div>
      ) : null}

      {filteredGroups.map((group) => {
        const fullModuleCodes =
          PERMISSION_GROUPS.find((item) => item.module === group.module)?.permissions.map(
            (item) => item.code
          ) ?? group.permissions.map((item) => item.code)
        const selectedCount = fullModuleCodes.filter((code) => selectedSet.has(code)).length

        return (
          <Card key={group.module} className="group rounded-3xl">
            <CardHeader>
              <CardTitle>{group.module}</CardTitle>
              <CardDescription>
                {selectedCount} / {fullModuleCodes.length} 项已选
              </CardDescription>
              <CardAction className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${group.module}全选`}
                        onClick={() => applyLocalPreset(fullModuleCodes, 'all')}
                      >
                        <CheckCheck />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>全选</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${group.module}仅只读`}
                        onClick={() => applyLocalPreset(fullModuleCodes, 'readonly')}
                      >
                        <Eye />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>只读</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${group.module}清除`}
                        onClick={() => applyLocalPreset(fullModuleCodes, 'none')}
                      >
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
                {group.permissions.map((item) => {
                  const checked = selectedSet.has(item.code)
                  return (
                    <FieldLabel
                      key={item.code}
                      htmlFor={item.code}
                      className="min-w-0 has-[>[data-slot=field]]:rounded-2xl"
                    >
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            {item.name}
                            <Badge variant="ghost" className="text-xs text-muted-foreground">
                              {item.code}
                            </Badge>
                          </FieldTitle>
                          <FieldDescription>{item.description}</FieldDescription>
                        </FieldContent>
                        <Switch
                          id={item.code}
                          checked={checked}
                          onCheckedChange={(next) => togglePermission(item.code, next)}
                          aria-label={`切换权限 ${item.name}`}
                        />
                      </Field>
                    </FieldLabel>
                  )
                })}
              </FieldGroup>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
