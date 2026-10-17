import {
  Button,
  cn,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  toast
} from '@zen/ui'
import { Download, Search, UserPlus, UserRoundArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'

import { selectItemsById, useListSelection } from '@/hooks'

import { useOrganizationDetail, useOrganizationMembers } from '../queries'
import { OrganizationAddMemberDialog } from './organization-add-member-dialog'
import { OrganizationBatchTransferDialog } from './organization-batch-transfer-dialog'
import {
  OrganizationMemberCard,
  organizationMemberName,
  organizationMemberStatusLabel
} from './organization-member-card'
import { OrganizationMembersBulkActions } from './organization-members-bulk-actions'
import { OrganizationRemoveMemberDialog } from './organization-remove-member-dialog'

import type { OrganizationMember } from '../type'

const EMPTY_MEMBERS: OrganizationMember[] = []

type MemberDialog =
  | { type: 'add' }
  | { type: 'remove'; member: OrganizationMember }
  | { type: 'batchTransfer' }
  | null

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

function exportMembersToCsv(members: OrganizationMember[], orgName?: string) {
  if (members.length === 0) {
    toast.add({ title: '当前没有可导出的成员数据', type: 'info' })
    return
  }

  const headers = ['姓名', '账号', '岗位', '职级', '账号状态', '邮箱', '手机号']
  const rows = members.map((member) => [
    organizationMemberName(member),
    member.username,
    member.post ?? '未分配',
    member.level ?? '未定级',
    organizationMemberStatusLabel(member.accountStatus),
    member.email ?? '',
    member.phoneNumber ?? ''
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
  const selection = useListSelection()

  const [keyword, setKeyword] = useState('')
  const [dialog, setDialog] = useState<MemberDialog>(null)

  const memberIds = useMemo(
    () => new Set(membersData?.map((member) => member.id) ?? []),
    [membersData]
  )

  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMember(member, keyword)),
    [keyword, members]
  )

  const selectedMembers = useMemo(
    () => selectItemsById(members, selection.selectedIds),
    [members, selection.selectedIds]
  )

  return (
    <div className={cn('@container flex flex-col gap-4', 'max-sm:has-[div[role="toolbar"]]:mb-16')}>
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

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">加载成员…</p>
      ) : filteredMembers.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredMembers.map((item) => (
            <OrganizationMemberCard
              key={item.id}
              member={item}
              isSelecting={selection.isSelecting}
              selected={selection.isSelected(item.id)}
              onSelectedChange={(nextSelected) => selection.setSelected(item.id, nextSelected)}
              onRemove={() => setDialog({ type: 'remove', member: item })}
            />
          ))}
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
          selection.clear()
          setDialog(null)
        }}
      />

      <OrganizationMembersBulkActions
        organizationId={organizationId}
        selectedMembers={selectedMembers}
        isSelecting={selection.isSelecting}
        onClearSelection={selection.clear}
        onBatchTransfer={() => setDialog({ type: 'batchTransfer' })}
      />
    </div>
  )
}
