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
