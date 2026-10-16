import { createAuditDiff, getOrganizationTypeLabel } from '@zen/shared'

import { toApiOrganizationType } from './organization.mapper.js'

import type { OrganizationType as PrismaOrganizationType } from '@prisma/client'
import type { AuditDiff, AuditDiffChange, OrganizationType } from '@zen/shared'
import type { UpdateOrganizationDto } from './dto/index.js'

function displayValue(value: string | null | undefined): string | null {
  if (value == null || value === '') return null
  return value
}

function formatEffectiveDate(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  const date =
    value instanceof Date ? value : new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function organizationTypeLabel(
  type: OrganizationType | PrismaOrganizationType | null | undefined
): string | null {
  if (!type) return null
  const apiType =
    typeof type === 'string' && type === type.toLowerCase()
      ? (type as OrganizationType)
      : toApiOrganizationType(type as PrismaOrganizationType)
  return getOrganizationTypeLabel(apiType)
}

function pushChange(
  changes: AuditDiffChange[],
  field: string,
  label: string,
  from: string | null,
  to: string | null
) {
  if (from === to) return
  changes.push({ field, label, from, to })
}

export function toUserDisplayName(user: {
  username: string
  nickname: string | null
  profile?: { realName: string | null } | null
}): string {
  return user.profile?.realName ?? user.nickname ?? user.username
}

export function buildOrganizationCreatedDiff(org: {
  id: string
  code: string
  name: string
}): AuditDiff {
  return createAuditDiff({
    summary: `创建了组织「${org.name}」`,
    target: { id: org.id, code: org.code, name: org.name }
  })
}

export function buildOrganizationDeletedDiff(org: {
  id: string
  code: string
  name: string
}): AuditDiff {
  return createAuditDiff({
    summary: `删除了组织「${org.name}」`,
    target: { id: org.id, code: org.code, name: org.name }
  })
}

export function buildOrganizationUpdatedDiff(
  existing: {
    id: string
    code: string
    name: string
    type: PrismaOrganizationType
    description: string | null
    effectiveDate: Date
  },
  data: UpdateOrganizationDto
): AuditDiff {
  const changes: AuditDiffChange[] = []

  if (data.name !== undefined) {
    pushChange(changes, 'name', '组织名称', displayValue(existing.name), displayValue(data.name))
  }
  if (data.type !== undefined) {
    pushChange(
      changes,
      'type',
      '组织类型',
      organizationTypeLabel(existing.type),
      organizationTypeLabel(data.type)
    )
  }
  if (data.description !== undefined) {
    pushChange(
      changes,
      'description',
      '组织描述',
      displayValue(existing.description),
      displayValue(data.description)
    )
  }
  if (data.effectiveDate !== undefined) {
    pushChange(
      changes,
      'effectiveDate',
      '生效日期',
      formatEffectiveDate(existing.effectiveDate),
      formatEffectiveDate(data.effectiveDate)
    )
  }

  return createAuditDiff({
    target: { id: existing.id, code: existing.code, name: existing.name },
    changes,
    summary: changes.length > 0 ? undefined : '更新了组织信息'
  })
}

export function buildOrganizationLeaderDiff(
  org: { id: string; code: string; name: string },
  fromLeader: { id: string; name: string } | null,
  toLeader: { id: string; name: string } | null
): AuditDiff {
  return createAuditDiff({
    target: { id: org.id, code: org.code, name: org.name },
    changes: [
      {
        field: 'leaderId',
        label: '负责人',
        from: fromLeader?.name ?? null,
        to: toLeader?.name ?? null
      }
    ]
  })
}

export function buildOrganizationParentDiff(
  org: { id: string; code: string; name: string },
  fromParent: { id: string; name: string } | null,
  toParent: { id: string; name: string } | null
): AuditDiff {
  return createAuditDiff({
    target: { id: org.id, code: org.code, name: org.name },
    changes: [
      {
        field: 'parentId',
        label: '上级组织',
        from: fromParent?.name ?? '无（根组织）',
        to: toParent?.name ?? '无（根组织）'
      }
    ]
  })
}

export function buildOrganizationMembersDiff(
  org: { id: string; code: string; name: string },
  members: Array<{ id: string; name: string }>,
  kind: 'added' | 'removed'
): AuditDiff {
  return createAuditDiff({
    target: { id: org.id, code: org.code, name: org.name },
    members: kind === 'added' ? { added: members } : { removed: members }
  })
}

export function buildOrganizationPositionCreatedDiff(
  org: { id: string; code: string; name: string },
  position: { id: string; code: string; name: string; level?: string; headcount?: number }
): AuditDiff {
  return createAuditDiff({
    summary: `关联了岗位「${position.name}」`,
    target: { id: org.id, code: org.code, name: org.name },
    meta: {
      positionId: position.id,
      positionCode: position.code,
      positionName: position.name,
      level: position.level,
      headcount: position.headcount
    }
  })
}

export function buildOrganizationMergedDiff(
  source: { id: string; code: string; name: string },
  target: { id: string; code: string; name: string },
  childrenCount: number,
  membersCount: number
): AuditDiff {
  return createAuditDiff({
    summary: `组织「${source.name}」已合并入「${target.name}」并注销（划转 ${childrenCount} 个下级部门，${membersCount} 名在岗成员）`,
    target: { id: source.id, code: source.code, name: source.name },
    changes: [
      {
        field: 'targetOrganizationId',
        label: '合并目标组织',
        from: null,
        to: target.name
      }
    ],
    meta: {
      targetOrgId: target.id,
      targetOrgName: target.name,
      targetOrgCode: target.code,
      transferredChildrenCount: childrenCount,
      transferredMembersCount: membersCount
    }
  })
}

export function buildOrganizationMergedInDiff(
  target: { id: string; code: string; name: string },
  source: { id: string; code: string; name: string },
  children: Array<{ id: string; name: string }>,
  members: Array<{ id: string; name: string }>
): AuditDiff {
  return createAuditDiff({
    summary: `合并并入了组织「${source.name}」（划转 ${children.length} 个下级部门，${members.length} 名在岗成员）`,
    target: { id: target.id, code: target.code, name: target.name },
    members: members.length > 0 ? { added: members } : undefined,
    meta: {
      sourceOrgId: source.id,
      sourceOrgName: source.name,
      sourceOrgCode: source.code,
      children
    }
  })
}

export function buildOrganizationDissolvedDiff(
  source: { id: string; code: string; name: string },
  options: {
    transferChildren: boolean
    targetOrg?: { id: string; name: string } | null
    targetChildrenOrg?: { id: string; name: string } | null
    parentOrg?: { id: string; name: string } | null
    childrenCount: number
    membersCount: number
    cascadeDeletedCount?: number
  }
): AuditDiff {
  let childrenDesc = ''
  if (!options.transferChildren) {
    childrenDesc = `连同 ${options.cascadeDeletedCount ?? options.childrenCount} 个下级部门一并彻底删除`
  } else if (options.targetChildrenOrg) {
    childrenDesc = `${options.childrenCount} 个下级部门合并划转至「${options.targetChildrenOrg.name}」`
  } else if (options.parentOrg) {
    childrenDesc = `${options.childrenCount} 个下级部门自动提升一级挂靠至「${options.parentOrg.name}」`
  } else {
    childrenDesc = `${options.childrenCount} 个下级部门自动提升为根组织`
  }

  let membersDesc = ''
  if (options.targetOrg) {
    membersDesc = `${options.membersCount} 名在岗成员平移安置至「${options.targetOrg.name}」`
  } else {
    membersDesc = `直接清理解除了 ${options.membersCount} 名成员的部门任职`
  }

  return createAuditDiff({
    summary: `解散并注销了组织「${source.name}」（${childrenDesc}；${membersDesc}）`,
    target: { id: source.id, code: source.code, name: source.name },
    meta: {
      transferChildren: options.transferChildren,
      targetOrgId: options.targetOrg?.id ?? null,
      targetOrgName: options.targetOrg?.name ?? null,
      targetChildrenOrgId: options.targetChildrenOrg?.id ?? null,
      targetChildrenOrgName: options.targetChildrenOrg?.name ?? null,
      childrenCount: options.childrenCount,
      membersCount: options.membersCount,
      cascadeDeletedCount: options.cascadeDeletedCount ?? 0
    }
  })
}

export function buildOrganizationCascadeDeletedDiff(
  child: { id: string; code: string; name: string },
  rootOrg: { id: string; name: string }
): AuditDiff {
  return createAuditDiff({
    summary: `因上级组织「${rootOrg.name}」解散，级联删除了组织「${child.name}」`,
    target: { id: child.id, code: child.code, name: child.name },
    meta: {
      cascadeFromOrgId: rootOrg.id,
      cascadeFromOrgName: rootOrg.name
    }
  })
}

export function buildOrganizationMemberTransferDiff(
  kind: 'transfer_out' | 'transfer_in',
  sourceOrg: { id: string; code: string; name: string },
  targetOrg: { id: string; code: string; name: string },
  members: Array<{ id: string; name: string }>,
  post?: { id: string; name: string } | null
): AuditDiff {
  if (kind === 'transfer_out') {
    return createAuditDiff({
      summary: `调出 ${members.length} 名成员至「${targetOrg.name}」`,
      target: { id: sourceOrg.id, code: sourceOrg.code, name: sourceOrg.name },
      members: { removed: members },
      meta: {
        direction: 'out',
        targetOrgId: targetOrg.id,
        targetOrgName: targetOrg.name,
        targetOrgCode: targetOrg.code
      }
    })
  }

  const postDesc = post?.name ? `，并分配岗位「${post.name}」` : ''
  return createAuditDiff({
    summary: `从「${sourceOrg.name}」调入 ${members.length} 名成员${postDesc}`,
    target: { id: targetOrg.id, code: targetOrg.code, name: targetOrg.name },
    members: { added: members },
    meta: {
      direction: 'in',
      sourceOrgId: sourceOrg.id,
      sourceOrgName: sourceOrg.name,
      sourceOrgCode: sourceOrg.code,
      postId: post?.id ?? null,
      postName: post?.name ?? null
    }
  })
}
