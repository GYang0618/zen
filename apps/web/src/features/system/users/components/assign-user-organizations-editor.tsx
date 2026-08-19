import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  RadioGroup,
  Skeleton
} from '@zen/ui'

import { OrganizationParentSelect } from '@/features/system/organization/components/organization-parent-select'

import { AssignUserMembershipRow } from './assign-user-membership-row'

import type { Organization } from '@/features/system/organization/type'
import type { MembershipDraft } from '../utils'

type AssignUserOrganizationsEditorProps = {
  treeLoading: boolean
  treeError: boolean
  hasAvailableOrgs: boolean
  tree: Organization[]
  selectableIds: Set<string>
  memberships: MembershipDraft[]
  primaryOrgId: string
  resolveOrgName: (organizationId: string) => string
  resolveOrgType: (organizationId: string) => string | undefined
  onRetry: () => void
  onAdd: (organizationId: string) => void
  onPrimaryChange: (organizationId: string) => void
  onPostChange: (organizationId: string, postId: string, postName?: string) => void
  onRemove: (organizationId: string) => void
}

export function AssignUserOrganizationsEditor({
  treeLoading,
  treeError,
  hasAvailableOrgs,
  tree,
  selectableIds,
  memberships,
  primaryOrgId,
  resolveOrgName,
  resolveOrgType,
  onRetry,
  onAdd,
  onPrimaryChange,
  onPostChange,
  onRemove
}: AssignUserOrganizationsEditorProps) {
  if (treeLoading) return <Skeleton className="mt-4 h-40 w-full" />

  if (treeError) {
    return (
      <Empty className="mt-4 border">
        <EmptyHeader>
          <EmptyTitle>未能加载组织</EmptyTitle>
          <EmptyDescription>请检查网络后重试</EmptyDescription>
        </EmptyHeader>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <Field>
        <FieldLabel>添加组织</FieldLabel>
        <OrganizationParentSelect
          value=""
          onValueChange={onAdd}
          tree={tree}
          selectableIds={selectableIds}
          allowEmpty={false}
          disabled={!hasAvailableOrgs}
          placeholder={hasAvailableOrgs ? '搜索并添加组织…' : '没有可添加的组织'}
          aria-label="添加组织"
        />
        <FieldDescription>加入后可在下方设置岗位，并用单选项指定主职。</FieldDescription>
      </Field>

      {memberships.length > 0 ? (
        <FieldSet>
          <FieldLegend variant="label">已加入的组织</FieldLegend>
          <RadioGroup
            value={primaryOrgId || undefined}
            onValueChange={onPrimaryChange}
            className="gap-3"
          >
            {memberships.map((item) => (
              <AssignUserMembershipRow
                key={item.organizationId}
                organizationId={item.organizationId}
                organizationName={resolveOrgName(item.organizationId)}
                organizationType={resolveOrgType(item.organizationId)}
                postId={item.postId}
                isPrimary={item.organizationId === primaryOrgId}
                onPostChange={(postId, postName) =>
                  onPostChange(item.organizationId, postId, postName)
                }
                onRemove={() => onRemove(item.organizationId)}
              />
            ))}
          </RadioGroup>
        </FieldSet>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>尚未分配组织</EmptyTitle>
            <EmptyDescription>从上方搜索并添加该用户要加入的组织</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
