import type {
  Organization,
  OrganizationActivity,
  OrganizationMember,
  OrganizationTreeNode,
  Paged,
  Position
} from '@zen/shared'

export type OrganizationResponse = Organization
export type OrganizationTreeResponse = OrganizationTreeNode[]
export type OrganizationMemberResponse = OrganizationMember
export type PositionResponse = Position
export type OrganizationActivitiesResponse = Paged<OrganizationActivity>
