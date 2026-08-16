import { Button } from '@zen/ui'
import { useState } from 'react'

import { formatMembersLine, ROLE_AUDIT_MEMBER_PREVIEW_LIMIT } from '../data/role-audit'

import type { MemberSection } from '../data/role-audit'

type RoleAuditMemberDescriptionProps = {
  section: MemberSection
}

export function RoleAuditMemberDescription({ section }: RoleAuditMemberDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const verb = section.kind === 'added' ? '添加了' : '移除了'
  const truncated = section.names.length > ROLE_AUDIT_MEMBER_PREVIEW_LIMIT
  const hiddenCount = Math.max(0, section.names.length - ROLE_AUDIT_MEMBER_PREVIEW_LIMIT)

  if (!truncated) {
    return <span>{formatMembersLine(section.names, verb, { expanded: true })}</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <span>
        {formatMembersLine(section.names, verb, {
          previewLimit: ROLE_AUDIT_MEMBER_PREVIEW_LIMIT,
          expanded
        })}
      </span>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto w-fit px-0 py-0 text-xs"
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? '收起' : `展开全部（还有 ${hiddenCount} 人）`}
      </Button>
    </div>
  )
}
