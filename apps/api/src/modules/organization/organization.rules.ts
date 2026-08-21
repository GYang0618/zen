import { BadRequestException } from '@nestjs/common'
import { canBeChildOf, canBeRootOrganization } from '@zen/shared'

import type { OrganizationType } from '@zen/shared'

export { canBeChildOf, ROOT_ORGANIZATION_TYPES } from '@zen/shared'

export type OrganizationMoveRejection =
  | 'ORG_MOVE_SAME_PARENT'
  | 'ORG_MOVE_TO_SELF'
  | 'ORG_MOVE_TO_DESCENDANT'
  | 'ORG_MOVE_INVALID_HIERARCHY'
  | 'ORG_MOVE_INVALID_ROOT_TYPE'

export function assertValidParentType(
  childType: OrganizationType,
  parentType: OrganizationType | null
): void {
  if (parentType === null && !canBeRootOrganization(childType)) {
    throwMoveRejection('ORG_MOVE_INVALID_ROOT_TYPE', '该组织类型不能作为根组织')
  }
  if (parentType !== null && !canBeChildOf(childType, parentType)) {
    throwMoveRejection('ORG_MOVE_INVALID_HIERARCHY', '组织类型不符合上下级规则')
  }
}

export function throwMoveRejection(reason: OrganizationMoveRejection, message: string): never {
  throw new BadRequestException({ message, reason })
}
