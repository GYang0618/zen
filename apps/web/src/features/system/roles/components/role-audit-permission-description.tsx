import { Badge, Button } from '@zen/ui'
import { useState } from 'react'

import { flattenPermissionPreview, ROLE_AUDIT_PERMISSION_PREVIEW_LIMIT } from '../data/role-audit'

import type { AuditDiffPermission } from '@zen/shared'
import type { PermissionSection } from '../data/role-audit'

type RoleAuditPermissionDescriptionProps = {
  sections: PermissionSection[]
}

function groupByModule(permissions: AuditDiffPermission[]) {
  const groups = new Map<string, string[]>()
  for (const permission of permissions) {
    const moduleName = permission.module || '其他'
    const names = groups.get(moduleName) ?? []
    names.push(permission.name)
    groups.set(moduleName, names)
  }
  return Array.from(groups.entries())
}

function PermissionChanges({ sections }: { sections: PermissionSection[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <div className="flex flex-col gap-1" key={section.kind}>
          <Badge variant={section.kind === 'added' ? 'secondary' : 'destructive'} className="w-fit">
            {section.kind === 'added' ? '新增' : '移除'}
          </Badge>
          {groupByModule(section.permissions).map(([moduleName, names]) => (
            <p className="leading-5" key={moduleName}>
              {moduleName}（{names.join('、')}）
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

export function RoleAuditPermissionDescription({ sections }: RoleAuditPermissionDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const { preview, truncated, hiddenCount } = flattenPermissionPreview(
    sections,
    ROLE_AUDIT_PERMISSION_PREVIEW_LIMIT
  )

  if (!truncated) {
    return <PermissionChanges sections={sections} />
  }

  return (
    <div className="flex flex-col gap-2">
      <PermissionChanges sections={expanded ? sections : preview} />
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto w-fit px-0 py-0 text-xs"
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? '收起' : `展开全部（还有 ${hiddenCount} 项）`}
      </Button>
    </div>
  )
}
