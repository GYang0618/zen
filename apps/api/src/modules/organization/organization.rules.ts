import { BadRequestException } from '@nestjs/common'

import type { OrganizationType } from '@zen/shared'

export const ROOT_ORGANIZATION_TYPES = new Set<OrganizationType>(['group', 'company', 'center'])

const ALLOWED_CHILD_TYPES: Record<OrganizationType, ReadonlySet<OrganizationType>> = {
  group: new Set(['company', 'center']),
  company: new Set(['branch', 'center']),
  branch: new Set(['center', 'department']),
  center: new Set(['department', 'team']),
  department: new Set(['team']),
  team: new Set()
}

export type OrganizationMoveRejection =
  | 'ORG_MOVE_SAME_PARENT'
  | 'ORG_MOVE_TO_SELF'
  | 'ORG_MOVE_TO_DESCENDANT'
  | 'ORG_MOVE_INVALID_HIERARCHY'
  | 'ORG_MOVE_INVALID_ROOT_TYPE'

export function canBeChildOf(child: OrganizationType, parent: OrganizationType): boolean {
  return ALLOWED_CHILD_TYPES[parent].has(child)
}

export function assertValidParentType(
  childType: OrganizationType,
  parentType: OrganizationType | null
): void {
  if (parentType === null && !ROOT_ORGANIZATION_TYPES.has(childType)) {
    throwMoveRejection('ORG_MOVE_INVALID_ROOT_TYPE', '该组织类型不能作为根组织')
  }
  if (parentType !== null && !canBeChildOf(childType, parentType)) {
    throwMoveRejection('ORG_MOVE_INVALID_HIERARCHY', '组织类型不符合上下级规则')
  }
}

export function throwMoveRejection(reason: OrganizationMoveRejection, message: string): never {
  throw new BadRequestException({ message, reason })
}
