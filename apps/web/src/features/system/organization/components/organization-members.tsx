import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Separator,
  toast
} from '@zen/ui'
import {
  ArrowRightLeft,
  CheckCircle,
  Download,
  Ellipsis,
  Mail,
  Phone,
  Search,
  UserPlus,
  UserRoundArrowLeft,
  UserRoundMinus,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useOrganizationDetail, useOrganizationMembers } from '../queries'
import { OrganizationAddMemberDialog } from './organization-add-member-dialog'
import { OrganizationBatchTransferDialog } from './organization-batch-transfer-dialog'
import { OrganizationRemoveMemberDialog } from './organization-remove-member-dialog'

import type { OrganizationMember } from '../type'

const EMPTY_MEMBERS: OrganizationMember[] = []

type MemberDialog =
  | { type: 'add' }
  | { type: 'remove'; member: OrganizationMember }
  | { type: 'batchTransfer' }
  | null

function displayName(member: OrganizationMember): string {
  return member.nickname ?? member.username
}

async function copyMemberContact(
  value: string | null,
  options: { emptyMessage: string; successLabel: string }
) {
  const text = value?.trim()
  if (!text) {
    toast.add({ title: options.emptyMessage, type: 'error' })
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `已复制${options.successLabel}：${text}`, type: 'success' })
  } catch {
    toast.add({ title: '复制失败，请手动选择', type: 'error' })
  }
}

function matchesMember(member: OrganizationMember, keyword: string): boolean {
  const q = keyword.trim().toLowerCase()
  if (!q) return true
  return [
    member.nickname,
    member.username,
    member.email,
    member.post,
    member.level,
    member.phoneNumber
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function accountStatusLabel(status: OrganizationMember['accountStatus']): string {
  if (status === 'active') return '已激活'
  if (status === 'pending') return '待激活'
  if (status === 'suspended') return '已停用'
  return '未激活'
}

function exportMembersToCsv(members: OrganizationMember[], orgName?: string) {
  if (members.length === 0) {
    toast.add({ title: '当前没有可导出的成员数据', type: 'info' })
    return
  }

  const headers = ['姓名', '账号', '岗位', '职级', '账号状态', '邮箱', '手机号']
  const rows = members.map((m) => [
    m.nickname ?? m.username,
    m.username,
    m.post ?? '未分配',
    m.level ?? '未定级',
    accountStatusLabel(m.accountStatus),
    m.email ?? '',
    m.phoneNumber ?? ''
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([`\ufeff${csvContent}`], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${orgName ?? '组织'}成员花名册_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.add({ title: `已成功导出 ${members.length} 条成员记录`, type: 'success' })
}

export function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const { data: orgDetail } = useOrganizationDetail(organizationId)
  const { data: membersData, isLoading } = useOrganizationMembers(organizationId)
  const members = membersData ?? EMPTY_MEMBERS

  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialog, setDialog] = useState<MemberDialog>(null)

  const memberIds = useMemo(
    () => new Set(membersData?.map((member) => member.id) ?? []),
    [membersData]
  )

  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMember(member, keyword)),
    [keyword, members]
  )

  const selectedMembers = useMemo(() => {
    const idSet = new Set(selectedIds)
    return members.filter((m) => idSet.has(m.id))
  }, [members, selectedIds])

  const handleToggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)))
  }

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMembers.map((m) => m.id))
    }
  }

  return (
    <div className="@container flex flex-col gap-4">
      {/* 顶部搜索与操作栏 */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-56 max-w-sm flex-1 items-center gap-2">
          <InputGroup className="w-full">
            <InputGroupInput
              placeholder="搜索成员姓名、岗位或邮箱"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => exportMembersToCsv(filteredMembers, orgDetail?.name)}
            title="导出当前筛选成员花名册为 CSV 表格"
          >
            <Download className="size-4" />
            导出花名册
          </Button>
          <Button type="button" onClick={() => setDialog({ type: 'add' })}>
            <UserPlus />
            添加成员
          </Button>
        </div>
      </section>

      {/* 批量操作工具条 */}
      {selectedIds.length > 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
              onCheckedChange={handleSelectAllFiltered}
              aria-label="全选当前筛选成员"
            />
            <span className="text-sm font-medium">
              已选中 <span className="font-bold text-primary">{selectedIds.length}</span> 名成员
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setDialog({ type: 'batchTransfer' })}
            >
              <ArrowRightLeft className="size-4" />
              批量调动部门
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              aria-label="取消选择"
            >
              <X className="size-4" />
              清空选择
            </Button>
          </div>
        </section>
      ) : null}

      {/* 成员网格 */}
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">加载成员…</p>
      ) : filteredMembers.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredMembers.map((item) => {
            const name = displayName(item)
            const isSelected = selectedIds.includes(item.id)
            return (
              <Card
                key={item.id}
                className={`relative rounded-2xl bg-background/80 transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                {/* 选择复选框 */}
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleToggleSelect(item.id, !!checked)}
                    aria-label={`选择${name}`}
                  />
                </div>

                {/* 菜单 */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`打开${name}的成员操作`}
                        />
                      }
                    >
                      <Ellipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDialog({ type: 'remove', member: item })}
                        >
                          <UserRoundMinus />
                          移除成员
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent className="pt-7">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Avatar className="size-14">
                      <AvatarImage src={item.avatar ?? undefined} />
                      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                      {item.accountStatus === 'active' ? (
                        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                      ) : null}
                    </Avatar>

                    <div className="text-center">
                      <h3 className="truncate text-sm font-semibold dark:text-zinc-100">{name}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground dark:text-zinc-400">
                        {[item.post, item.level].filter(Boolean).join(' · ') || '未分配岗位'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        主职
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-400">
                        <CheckCircle className="size-3.5 text-green-500" />
                        {accountStatusLabel(item.accountStatus)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-transparent p-0">
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 bg-transparent px-3 py-2.5 text-inherit transition-colors hover:bg-muted/50"
                    aria-label={`复制${name}的邮箱`}
                    onClick={() =>
                      void copyMemberContact(item.email, {
                        emptyMessage: '该成员暂无邮箱',
                        successLabel: '邮箱'
                      })
                    }
                  >
                    <Mail className="size-4" />
                    <span>邮箱</span>
                  </button>
                  <Separator orientation="vertical" className="h-full" />
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 bg-transparent px-3 py-2.5 text-inherit transition-colors hover:bg-muted/50"
                    aria-label={`复制${name}的电话`}
                    onClick={() =>
                      void copyMemberContact(item.phoneNumber, {
                        emptyMessage: '该成员暂无电话',
                        successLabel: '电话'
                      })
                    }
                  >
                    <Phone className="size-4" />
                    <span>电话</span>
                  </button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundArrowLeft />
            </EmptyMedia>
            <EmptyTitle>{members.length ? '未找到匹配成员' : '暂无成员'}</EmptyTitle>
            <EmptyDescription>
              {members.length ? '尝试调整搜索关键词，或添加新的成员' : '你可点击下方按钮添加成员'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button type="button" onClick={() => setDialog({ type: 'add' })}>
              <UserPlus />
              添加成员
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <OrganizationAddMemberDialog
        organizationId={organizationId}
        memberIds={memberIds}
        open={dialog?.type === 'add'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />

      <OrganizationRemoveMemberDialog
        organizationId={organizationId}
        member={dialog?.type === 'remove' ? dialog.member : null}
        open={dialog?.type === 'remove'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />

      <OrganizationBatchTransferDialog
        open={dialog?.type === 'batchTransfer'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        organizationId={organizationId}
        selectedMembers={selectedMembers}
        onSuccess={() => {
          setSelectedIds([])
          setDialog(null)
        }}
      />
    </div>
  )
}
